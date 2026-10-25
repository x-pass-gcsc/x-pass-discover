'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Badge, Button, Card, CardHeader, EmptyState } from '@/components/ui';
import { useToast } from '@/components/toast';
import { BadgeShelf, NpcDialogue, PlayerHud, QuestTracker, RewardBurst } from '@/features/game/hud';
import {
  currentQuest,
  currentQuestStep,
  rewardBetween,
  type Reward,
} from '@/features/game/progress';
import { WorkspaceClient } from '@/features/workspace/workspace-client';
import { Minimap } from './minimap';
import { ChatPanel } from '@/features/ai/chat-panel';
import { ResourcePanel } from '@/features/resources/resource-panel';
import { OfficeBridge, type OfficeEvent } from '@/game/office/bridge';
import type { OfficeLabels } from '@/game/office/labels';
import { useT } from '@/i18n/client';
import type { MessageKey } from '@/i18n/messages/en';
import { NPCS, ROOMS, type OfficeNpc } from '@/game/office/map';
import { logClientEvent } from '@/lib/client-api';
import type { SessionView } from '@/types/session-view';
import { OfficeCanvas } from './office-canvas';

type Overlay =
  | { kind: 'none' }
  | { kind: 'resources' }
  | { kind: 'badges' }
  | { kind: 'chat'; personaKey: string; stepKey: string }
  | { kind: 'message'; title: string; body: string }
  | { kind: 'notifications' };

/** A senior handing over a step, shown as a dialogue box over the office. */
type Dialogue = { npc: OfficeNpc; stepKey: string; again: boolean };

/**
 * The office page — the whole game.
 *
 * The student walks the office, picks up each step from the senior or the
 * room it belongs to, and does the work in the work window that opens over the
 * office, without leaving it. Phaser reports an interaction; React decides
 * what it means, owns the session view, and draws the HUD (level, quest,
 * badges, rewards). Business state stays on this side of the bridge.
 */
export function OfficeClient({
  initialView,
  openWork = false,
  openStepKey = null,
  playerName,
}: {
  initialView: SessionView | null;
  openWork?: boolean;
  /** The step to open the work window on, when `openWork`. */
  openStepKey?: string | null;
  playerName: string;
}) {
  const t = useT();
  const toast = useToast();
  const bridge = useMemo(() => new OfficeBridge(), []);
  const roomName = (key: string) => t(`office.room.${key}` as MessageKey);
  const labels = useMemo<OfficeLabels>(
    () => ({
      room: (room) => t(`office.room.${room.key}` as MessageKey),
      action: (room) =>
        room.action.kind === 'info' ? '' : t(`office.action.${room.action.kind}` as MessageKey),
      role: (npc) => t(`office.npc.${npc.key}` as MessageKey),
      talk: t('office.talk'),
      you: t('office.you'),
      promptTarget: (action, target) => t('office.promptSr.target', { action, target }),
      promptZone: (action) => t('office.promptSr.zone', { action }),
    }),
    [t],
  );
  const [view, setView] = useState<SessionView | null>(initialView);
  // Switching language re-renders the page on the server; take the re-worded view.
  const [renderedView, setRenderedView] = useState(initialView);
  if (initialView !== renderedView) {
    setRenderedView(initialView);
    setView(initialView);
  }
  const [prompt, setPrompt] = useState<{
    text: string;
    action: string;
    target: string | null;
  } | null>(null);
  const [zoneKey, setZoneKey] = useState<string | null>('reception');
  const [playerTile, setPlayerTile] = useState<{ x: number; y: number } | null>(null);
  const [booted, setBooted] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' });
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  /** The step open in the work window, or null when the window is closed. */
  const [workStepKey, setWorkStepKey] = useState<string | null>(() =>
    openWork && initialView
      ? ((openStepKey && initialView.steps.some((s) => s.key === openStepKey) ? openStepKey : null) ??
        currentQuestStep(initialView)?.key ??
        initialView.session.currentStepKey ??
        initialView.steps[0]?.key ??
        null)
      : null,
  );
  /** Steps the student has accepted from a senior, so the second visit is shorter. */
  const accepted = useRef(new Set<string>());
  const viewRef = useRef(view);
  viewRef.current = view;

  const quest = useMemo(() => currentQuest(view), [view]);
  const questRef = useRef(quest);
  questRef.current = quest;

  /** Every save comes through here, so the HUD can count what it earned. */
  const updateView = useCallback((next: SessionView) => {
    const before = viewRef.current;
    if (before) {
      const gained = rewardBetween(before, next);
      if (gained) setReward(gained);
    }
    viewRef.current = next;
    setView(next);
  }, []);

  const openWorkWindow = useCallback((stepKey?: string | null) => {
    const current = viewRef.current;
    if (!current) {
      setOverlay(noSessionMessage());
      return;
    }
    setDialogue(null);
    setWorkStepKey(
      stepKey ??
        currentQuestStep(current)?.key ??
        current.session.currentStepKey ??
        current.steps[0]?.key ??
        null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the quest marker on whatever the next piece of work is. Re-sent on
  // `ready`, since a command before the scene exists has nowhere to go.
  const sendMarker = useCallback(() => {
    const target = questRef.current?.target;
    bridge.command({
      type: 'marker',
      marker: target
        ? { x: target.x, y: target.y, npcKey: target.kind === 'npc' ? target.npcKey : null }
        : null,
    });
  }, [bridge]);
  useEffect(() => sendMarker(), [quest, sendMarker]);

  // The address bar remembers an open work window, so a reload or a shared
  // link comes back to the same step rather than to the lobby.
  const sessionId = view?.session.id ?? null;
  useEffect(() => {
    if (!sessionId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    if (workStepKey) {
      url.searchParams.set('work', '1');
      url.searchParams.set('step', workStepKey);
    } else {
      url.searchParams.delete('work');
      url.searchParams.delete('step');
    }
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
  }, [sessionId, workStepKey]);

  // Walking pauses while anything you can type into is open over the office.
  const paused = workStepKey !== null || dialogue !== null || overlay.kind === 'chat';
  useEffect(() => {
    bridge.command({ type: 'controls', enabled: !paused });
  }, [bridge, paused, booted]);

  useEffect(() => {
    const unsubscribe = bridge.subscribe((event: OfficeEvent) => {
      switch (event.type) {
        case 'ready':
          setBooted(true);
          sendMarker();
          break;

        case 'player_moved':
          setPlayerTile({ x: event.x, y: event.y });
          break;

        case 'prompt':
          setPrompt(
            event.text && event.action
              ? { text: event.text, action: event.action, target: event.target }
              : null,
          );
          break;

        case 'zone_changed': {
          setZoneKey(event.room?.key ?? null);
          const session = viewRef.current?.session;
          if (session && event.room) {
            void logClientEvent(session.id, {
              eventType: 'office_zone_entered',
              metadata: { zoneKey: event.room.key, zoneName: event.room.name },
            });
          }
          break;
        }

        case 'interact_npc':
          handleNpc(event.npc);
          break;

        case 'interact_zone': {
          const action = event.room.action;
          const target = questRef.current?.target;
          // The room the next step is set in opens that step, whatever the room.
          if (target?.kind === 'room' && target.roomKey === event.room.key && action.kind !== 'meeting') {
            openWorkWindow(questRef.current?.step.key);
          } else if (action.kind === 'resources') setOverlay({ kind: 'resources' });
          else if (action.kind === 'notifications') setOverlay({ kind: 'notifications' });
          else if (action.kind === 'workspace') openWorkWindow();
          else if (action.kind === 'meeting') openMeeting();
          break;
        }

        default:
          break;
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge]);

  function noSessionMessage(): Overlay {
    return {
      kind: 'message',
      title: t('office.noBootcamp'),
      body: t('office.noSessionBody'),
    };
  }

  /**
   * Resolves which step a persona conversation belongs to: prefer the step the
   * student is actually on if it uses this persona, otherwise the NPC default.
   */
  function resolveStep(personaKey: string, fallback: string | null): string | null {
    const current = viewRef.current;
    if (!current) return fallback;
    // The office is shared by every department, so an NPC may belong to a
    // scenario this session is not running.
    if (!current.personas.some((p) => p.key === personaKey)) return null;
    const matching = current.steps.filter((step) =>
      step.tasks.some((task) => task.personaKey === personaKey),
    );
    const live = matching.find(
      (step) => step.unlocked && step.status !== 'completed',
    );
    return live?.key ?? fallback;
  }

  function handleNpc(npc: OfficeNpc) {
    const current = viewRef.current;

    if (current) {
      void logClientEvent(current.session.id, {
        eventType: 'npc_interaction_started',
        metadata: { npcKey: npc.key, personaKey: npc.personaKey },
      });
    }

    if (!npc.personaKey) {
      setOverlay({
        kind: 'message',
        title: npc.name,
        body: t('office.receptionBody'),
      });
      return;
    }

    if (!current) {
      setOverlay(noSessionMessage());
      return;
    }

    if (!current.personas.some((p) => p.key === npc.personaKey)) {
      setOverlay({
        kind: 'message',
        title: npc.name,
        body: t('office.notInBootcamp', { name: npc.name }),
      });
      return;
    }

    // The senior who hands over the next step says so, and opens it.
    const q = questRef.current;
    if (q && q.npcKey === npc.key && !q.isConversation) {
      setDialogue({ npc, stepKey: q.step.key, again: accepted.current.has(q.step.key) });
      return;
    }

    const stepKey = resolveStep(npc.personaKey, npc.stepKey);
    if (!stepKey) {
      setOverlay(noSessionMessage());
      return;
    }

    const step = current.steps.find((s) => s.key === stepKey);
    if (!step?.unlocked) {
      setOverlay({
        kind: 'message',
        title: npc.name,
        body:
          step?.lockedReason ??
          t('office.notAvailable'),
      });
      return;
    }

    setOverlay({ kind: 'chat', personaKey: npc.personaKey, stepKey });
  }

  function openMeeting() {
    const current = viewRef.current;
    if (!current) {
      setOverlay(noSessionMessage());
      return;
    }
    const meetingStep = current.steps.find(
      (step) =>
        step.stepType === 'ai_interaction' &&
        step.unlocked &&
        step.status !== 'completed',
    );
    // A step can hold several conversations (three interviews, say): open the
    // first one that is still to be had.
    const personaTasks = meetingStep?.tasks.filter((t) => t.personaKey) ?? [];
    const personaKey = (
      personaTasks.find((t) => t.status !== 'complete') ?? personaTasks[0]
    )?.personaKey;
    if (!meetingStep || !personaKey) {
      setOverlay({
        kind: 'message',
        title: roomName('meeting-room-a'),
        body: t('office.noMeeting'),
      });
      return;
    }
    setOverlay({ kind: 'chat', personaKey, stepKey: meetingStep.key });
  }

  const activePersona =
    overlay.kind === 'chat'
      ? view?.personas.find((p) => p.key === overlay.personaKey)
      : undefined;

  const chatTask =
    overlay.kind === 'chat'
      ? view?.steps
          .find((s) => s.key === overlay.stepKey)
          ?.tasks.find((t) => t.personaKey === overlay.personaKey)
      : undefined;

  const currentStep = quest?.step ?? view?.steps.find((s) => s.key === view.session.currentStepKey);
  const questNpc = quest?.npcKey ? NPCS.find((npc) => npc.key === quest.npcKey) : undefined;
  const questRoomKey =
    quest?.target.kind === 'room'
      ? quest.target.roomKey
      : questNpc
        ? (ROOMS.find(
            (room) =>
              questNpc.x >= room.x &&
              questNpc.x < room.x + room.w &&
              questNpc.y >= room.y &&
              questNpc.y < room.y + room.h,
          )?.key ?? null)
        : null;
  const dialoguePersona = dialogue
    ? view?.personas.find((p) => p.key === dialogue.npc.personaKey)
    : undefined;
  const dialogueStep = dialogue ? view?.steps.find((s) => s.key === dialogue.stepKey) : undefined;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-line shadow-card">
          <OfficeCanvas bridge={bridge} labels={labels} />

          {/* Vignette keeps the eye on the avatar rather than the canvas edges. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow:
                'inset 0 0 0 1px rgba(15,23,41,0.06), inset 0 0 90px rgba(15,23,41,0.28)',
            }}
          />

          <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-2">
            {view ? (
              <PlayerHud
                view={view}
                playerName={playerName}
                onBadges={() =>
                  setOverlay((o) => (o.kind === 'badges' ? { kind: 'none' } : { kind: 'badges' }))
                }
              />
            ) : null}
            <span className="flex items-center gap-2 rounded-lg bg-[#1d2433]/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow-float">
              <span className="size-1.5 rounded-full bg-brand-400" aria-hidden />
              {zoneKey ? roomName(zoneKey) : t('office.corridor')}
            </span>
            <span className="hidden rounded-lg bg-[#1d2433]/70 px-3 py-1 text-[10px] text-white/75 sm:inline">
              <kbd className="font-mono text-white">WASD</kbd> /{' '}
              <kbd className="font-mono text-white">↑←↓→</kbd> {t('office.move')}
            </span>
          </div>

          <div className="absolute left-1/2 top-4 w-[min(440px,calc(100%-2rem))] -translate-x-1/2 max-xl:top-[150px] lg:max-xl:top-4 lg:max-xl:w-[380px]">
            <QuestTracker
              view={view}
              quest={quest}
              placeName={questRoomKey ? roomName(questRoomKey) : ''}
              npcName={quest?.npcKey ? (questNpc?.name ?? null) : null}
              player={playerTile}
              onStart={() => openWorkWindow(quest?.step.key)}
            />
          </div>

          {view && currentStep ? <TodaysTasks step={currentStep} /> : null}

          {dialogue && dialogueStep ? (
            <NpcDialogue
              name={dialogue.npc.name}
              role={t(`office.npc.${dialogue.npc.key}` as MessageKey)}
              persona={dialoguePersona}
              line={t(dialogue.again ? 'game.dialogue.again' : 'game.dialogue.handover', {
                title: dialogueStep.title,
              })}
              onAccept={() => {
                if (!accepted.current.has(dialogue.stepKey)) {
                  accepted.current.add(dialogue.stepKey);
                  toast.push({ tone: 'info', title: t('game.questAccepted'), description: dialogueStep.title });
                }
                openWorkWindow(dialogue.stepKey);
              }}
              onAsk={
                dialoguePersona
                  ? () => {
                      setDialogue(null);
                      setOverlay({ kind: 'chat', personaKey: dialoguePersona.key, stepKey: dialogue.stepKey });
                    }
                  : null
              }
              onLater={() => setDialogue(null)}
            />
          ) : null}

          <div className="absolute bottom-4 right-4 flex w-[190px] flex-col items-end gap-2">
            <div className="flex overflow-hidden rounded-lg bg-[#1d2433]/90 text-white shadow-float">
              <button
                type="button"
                onClick={() => bridge.command({ type: 'zoom', step: -1 })}
                className="grid size-8 place-items-center text-lg leading-none hover:bg-white/10"
                aria-label={t('office.zoomOut')}
                title={t('office.zoomOut')}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => bridge.command({ type: 'zoom', step: 1 })}
                className="grid size-8 place-items-center border-l border-white/10 text-lg leading-none hover:bg-white/10"
                aria-label={t('office.zoomIn')}
                title={t('office.zoomIn')}
              >
                +
              </button>
            </div>
            <div className="pointer-events-none w-full rounded-xl bg-[#1d2433]/85 p-2 shadow-float">
              <Minimap player={playerTile} activeRoomKey={zoneKey} quest={quest?.target ?? null} />
            </div>
          </div>

          {prompt ? (
            <div
              className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
              data-testid="office-prompt"
            >
              <span className="flex animate-pop items-center gap-2.5 rounded-xl border border-white/10 bg-[#1d2433]/95 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white shadow-float">
                <kbd className="grid size-7 place-items-center rounded-lg border border-brand-400 bg-[#141a26] font-mono text-xs font-semibold text-brand-300">
                  E
                </kbd>
                <span className="sr-only">{prompt.text}</span>
                <span aria-hidden>
                  {prompt.target
                    ? t('office.promptTo', { action: prompt.action, target: prompt.target })
                    : prompt.action}
                </span>
              </span>
            </div>
          ) : null}

          {!booted ? (
            <div className="absolute inset-0 grid place-items-center bg-surface/95">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="size-3.5 animate-spin rounded-full border-2 border-line-strong border-t-brand-400" />
                {t('office.entering')}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-sunken px-4 py-2.5">
          <p className="text-[11px] leading-relaxed text-muted">
            {t('office.hint.before')}
            <strong className="text-strong">{t('office.hint.desk')}</strong>
            {t('office.hint.mid1')}
            <strong className="text-strong">{t('office.hint.data')}</strong>
            {t('office.hint.mid2')}
            <strong className="text-strong">{t('office.hint.meeting')}</strong>
            {t('office.hint.mid3')}
            <kbd className="rounded border border-line bg-sunken px-1 py-px font-mono text-[10px] text-strong">
              E
            </kbd>
            {t('office.hint.after')}
          </p>
          {view ? (
            <button
              type="button"
              onClick={() => openWorkWindow()}
              className="shrink-0 text-[11px] font-medium text-brand-400 underline-offset-4 hover:underline"
            >
              {t('office.openWorkspace')}
            </button>
          ) : (
            <Link
              href="/departments"
              className="shrink-0 text-[11px] font-medium text-brand-400 underline-offset-4 hover:underline"
            >
              {t('office.startBootcamp')}
            </Link>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        {overlay.kind === 'none' ? (
          <Card>
            <CardHeader
              title={view ? view.department.projectTitle : t('office.visiting')}
              subtitle={
                view
                  ? t('office.currentStep', { step: currentStep?.title ?? '—' })
                  : t('office.noBootcamp')
              }
            />
            <div className="px-5 py-4">
              {view ? (
                <ol className="space-y-1.5">
                  {view.steps.map((step, index) => (
                    <li key={step.key} className="flex items-center gap-2.5 text-[11px]">
                      <span
                        className={`grid size-[18px] shrink-0 place-items-center rounded-full border text-[9px] font-semibold ${
                          step.status === 'completed'
                            ? 'border-accent-400/40 bg-accent-400/15 text-accent-400'
                            : step.key === view.session.currentStepKey
                              ? 'border-brand-400 bg-brand-500 text-white'
                              : step.unlocked
                                ? 'border-line bg-sunken text-muted'
                                : 'border-line bg-surface text-subtle'
                        }`}
                      >
                        {step.status === 'completed' ? '✓' : index + 1}
                      </span>
                      <span
                        className={
                          step.status === 'completed'
                            ? 'text-muted'
                            : step.unlocked
                              ? 'text-strong'
                              : 'text-subtle'
                        }
                      >
                        {step.title}
                      </span>
                      {step.officeZoneKey && step.unlocked && step.status !== 'completed' ? (
                        <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wider text-brand-400">
                          {t('office.here')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState>
                  {t('office.visitorBody')}
                </EmptyState>
              )}
            </div>
          </Card>
        ) : null}

        {overlay.kind === 'badges' && view ? (
          <div className="space-y-2">
            <OverlayHeader title={t('game.badgesTitle')} onClose={() => setOverlay({ kind: 'none' })} />
            <Card>
              <BadgeShelf view={view} />
            </Card>
          </div>
        ) : null}

        {overlay.kind === 'resources' && view ? (
          <div className="space-y-2">
            <OverlayHeader title={roomName('data-room')} onClose={() => setOverlay({ kind: 'none' })} />
            <ResourcePanel
              sessionId={view.session.id}
              resources={view.resources}
              stepKey={view.session.currentStepKey}
            />
          </div>
        ) : null}

        {overlay.kind === 'resources' && !view ? (
          <Card className="p-5">
            <EmptyState>{t('office.dataRoomEmpty')}</EmptyState>
          </Card>
        ) : null}

        {overlay.kind === 'chat' && view && activePersona ? (
          <div className="space-y-2">
            <OverlayHeader
              title={t('office.meetingWith', { name: activePersona.name })}
              onClose={() => setOverlay({ kind: 'none' })}
            />
            <ChatPanel
              sessionId={view.session.id}
              stepKey={overlay.stepKey}
              persona={activePersona}
              minStudentMessages={chatTask?.minStudentMessages ?? 0}
              onSessionUpdate={updateView}
            />
          </div>
        ) : null}

        {overlay.kind === 'notifications' ? (
          <div className="space-y-2">
            <OverlayHeader
              title={roomName('notification-area')}
              onClose={() => setOverlay({ kind: 'none' })}
            />
            <Card className="p-5">
              {view?.steps.find((s) => s.eventPayload && s.unlocked) ? (
                (() => {
                  const step = view.steps.find((s) => s.eventPayload && s.unlocked)!;
                  return (
                    <div>
                      <Badge tone="warn">{step.title}</Badge>
                      <h3 className="mt-3 text-sm font-semibold text-strong">
                        {step.eventPayload!.headline}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-body">
                        {step.eventPayload!.body}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOverlay({ kind: 'none' });
                          openWorkWindow(step.key);
                        }}
                        className="mt-4 inline-block text-[11px] text-brand-400 underline-offset-4 hover:underline"
                      >
                        {t('office.respond')}
                      </button>
                    </div>
                  );
                })()
              ) : (
                <EmptyState>{t('office.noMessages')}</EmptyState>
              )}
            </Card>
          </div>
        ) : null}

        {overlay.kind === 'message' ? (
          <div className="space-y-2">
            <OverlayHeader title={overlay.title} onClose={() => setOverlay({ kind: 'none' })} />
            <Card className="p-5">
              <p className="text-sm leading-relaxed text-body">{overlay.body}</p>
            </Card>
          </div>
        ) : null}
      </aside>

      {view && workStepKey ? (
        <WorkWindow
          view={view}
          onViewChange={updateView}
          stepKey={workStepKey}
          onStepChange={setWorkStepKey}
          onClose={() => setWorkStepKey(null)}
        />
      ) : null}

      {reward ? createPortal(<RewardBurst reward={reward} onDone={() => setReward(null)} />, document.body) : null}
    </div>
  );
}

const noSubscribe = () => () => undefined;

/**
 * The work window: the step's tasks, forms and files, opened over the office
 * like the screen of the desk computer. Closing it puts the student back where
 * they were standing.
 */
function WorkWindow({
  view,
  onViewChange,
  stepKey,
  onStepChange,
  onClose,
}: {
  view: SessionView;
  onViewChange: (next: SessionView) => void;
  stepKey: string;
  onStepChange: (stepKey: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const step = view.steps.find((s) => s.key === stepKey);
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // The page behind the window stays put while the window scrolls.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Portalled to <body>: the page's entrance animation leaves a transform on
  // <main>, which would otherwise make it, not the viewport, the window's frame.
  // There is no <body> to portal into on the server, so it opens on hydration.
  if (!hydrated) return null;
  return createPortal(
    <div
      // Under the site header (z-30), so the language and account menus stay usable.
      className="fixed inset-0 z-20 flex items-stretch justify-center bg-[#0f1729]/55 px-2 pb-2 pt-[72px] backdrop-blur-[3px] sm:px-4 sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('game.workWindow')}
      data-testid="work-window"
    >
      <div className="flex w-full max-w-[1500px] animate-pop flex-col overflow-hidden rounded-2xl border-[3px] border-[#1d2433] bg-canvas shadow-float">
        <div className="flex items-center gap-3 bg-[#1d2433] px-4 py-2 text-white">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-danger-400" />
            <span className="size-2.5 rounded-full bg-warn-400" />
            <span className="size-2.5 rounded-full bg-accent-400" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-semibold">
            🖥 {t('game.workWindow')} · {view.department.projectTitle}
            {step ? <span className="font-normal text-white/60"> — {step.title}</span> : null}
          </span>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-work"
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium hover:bg-white/20"
          >
            {t('game.backToOffice')}
            <kbd className="rounded border border-white/20 px-1 font-mono text-[9px] text-white/70">
              {t('game.escHint')}
            </kbd>
          </button>
        </div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <WorkspaceClient
            view={view}
            onViewChange={onViewChange}
            activeStepKey={stepKey}
            onActiveStepChange={onStepChange}
            scrollContainer={scrollRef}
            onReturnToOffice={onClose}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The current step's tasks as a checklist, ticked as they are completed. */
function TodaysTasks({ step }: { step: SessionView['steps'][number] }) {
  const t = useT();
  const [open, setOpen] = useState(true);
  return (
    <div className="absolute right-4 top-4 w-[230px] overflow-hidden rounded-xl border-2 border-[#1d2433] bg-surface/95 shadow-float max-md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 bg-[#1d2433] px-3 py-2 text-left text-xs font-semibold text-white"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-warn-400" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <rect x="3" y="4" width="14" height="13" rx="2" />
          <path d="M3 8h14M7 2.5v3M13 2.5v3" strokeLinecap="round" />
        </svg>
        <span className="flex-1">{t('office.todaysTasks')}</span>
        <span aria-hidden className={`text-[10px] transition-transform ${open ? '' : 'rotate-180'}`}>
          ▲
        </span>
      </button>
      {open ? (
        <ul className="divide-y divide-line px-3 py-1">
          {step.tasks.length === 0 ? (
            <li className="py-2 text-[11px] text-muted">{step.title}</li>
          ) : (
            step.tasks.map((task) => {
              const done = task.status === 'complete';
              return (
                <li key={task.key} className="flex items-center gap-2.5 py-2">
                  <span
                    aria-hidden
                    className={`grid size-4 shrink-0 place-items-center rounded border text-[10px] font-bold ${
                      done
                        ? 'border-accent-500 bg-accent-500 text-white'
                        : task.status === 'draft'
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-line-strong bg-surface'
                    }`}
                  >
                    {done ? '✓' : ''}
                  </span>
                  <span
                    className={`text-xs ${done ? 'text-muted line-through' : 'text-strong'}`}
                  >
                    {task.title}
                    <span className="sr-only">{done ? ` ${t('office.done')}` : ''}</span>
                  </span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

function OverlayHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      <Button variant="ghost" onClick={onClose} className="px-2 py-1 text-[11px]">
        {t('common.close')}
      </Button>
    </div>
  );
}
