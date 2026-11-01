'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RuntimeBadges } from '@/components/branding';
import { Badge, Button, Card } from '@/components/ui';
import { FileIcon } from '@/components/media';
import { ResourceBodyView } from '@/features/resources/resource-panel';
import { questFor } from '@/features/game/progress';
import { NPCS } from '@/game/office/map';
import { useT } from '@/i18n/client';
import type { MessageKey } from '@/i18n/messages/en';
import { logResourceOpen, startStep } from '@/lib/client-api';
import type { ResourceDefinition } from '@/types/resource';
import type { SessionView, StepView } from '@/types/session-view';
import { EventCard } from './event-card';
import { ReferencePanel } from './reference-panel';
import { MentorChat } from './mentor-chat';
import { ResourceLibrary } from './resource-library';
import { DeadlineCountdown } from './deadline-countdown';
import { TodayTasks } from './today-tasks';
import { TaskCard } from './task-card';

const STEP_STATUS_TONE = {
  completed: 'success',
  in_progress: 'brand',
  available: 'brand',
  locked: 'muted',
} as const;

/**
 * The work/data layer.
 *
 * Everything the student actually produces lives here in normal React. It is
 * shown as the work window inside the office (see `office-client.tsx`), which
 * owns the session view so the office HUD sees every save as it lands. The
 * Phaser office never holds business state.
 */
export function WorkspaceClient({
  view,
  onViewChange,
  activeStepKey,
  onActiveStepChange,
  onReturnToOffice,
}: {
  view: SessionView;
  onViewChange: (next: SessionView) => void;
  activeStepKey: string;
  onActiveStepChange: (stepKey: string) => void;
  /** Closes the work window, for a next step that is picked up elsewhere. */
  onReturnToOffice?: () => void;
}) {
  const t = useT();
  const setActiveStepKey = onActiveStepChange;

  const activeStep = useMemo(
    () => view.steps.find((s) => s.key === activeStepKey) ?? view.steps[0],
    [view.steps, activeStepKey],
  );

  // Record that the student opened this step. Fire-and-forget by design.
  useEffect(() => {
    if (!activeStep?.unlocked) return;
    void startStep(view.session.id, activeStep.key);
  }, [view.session.id, activeStep?.key, activeStep?.unlocked]);

  // When a save finishes the step the student is on, bring the "next step"
  // card into view so they are not left staring at a 再提出 button.
  const nextStepRef = useRef<HTMLDivElement>(null);
  const [scrollToNext, setScrollToNext] = useState(false);
  const handleSessionUpdate = useCallback(
    (next: SessionView) => {
      const before = view.steps.find((s) => s.key === activeStepKey);
      const after = next.steps.find((s) => s.key === activeStepKey);
      if (before?.status !== 'completed' && after?.status === 'completed') {
        setScrollToNext(true);
      }
      onViewChange(next);
    },
    [view.steps, activeStepKey, onViewChange],
  );

  useEffect(() => {
    if (!scrollToNext) return;
    setScrollToNext(false);
    nextStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [scrollToNext]);

  const centerRef = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState<ResourceDefinition | null>(null);
  const openResource = useCallback(
    (resource: ResourceDefinition) => {
      setReading(resource);
      // Which files a student reads, and when, is evidence; the count is never a score.
      void logResourceOpen(view.session.id, resource.key, activeStepKey);
    },
    [view.session.id, activeStepKey],
  );

  const goToStep = useCallback(
    (stepKey: string) => {
      setActiveStepKey(stepKey);
      setReading(null);
      centerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setActiveStepKey],
  );

  const isComplete = view.session.status === 'completed';
  const activeIndex = view.steps.findIndex((s) => s.key === activeStep?.key);
  const nextStep = activeIndex >= 0 ? view.steps[activeIndex + 1] : undefined;

  if (!activeStep) {
    return <p className="text-sm text-muted">{t('workspace.noSteps')}</p>;
  }

  const stepNumber = String(activeIndex + 1).padStart(2, '0');

  return (
    <div className="grid h-full min-h-0 gap-0 max-xl:overflow-y-auto xl:grid-cols-[250px_minmax(0,1fr)_330px]">
      {/* Left: the file browser */}
      <aside className="flex min-h-0 flex-col border-line bg-surface max-xl:border-b xl:border-r">
        <div className="min-h-0 flex-1 max-xl:max-h-[320px]">
          <ResourceLibrary
            resources={view.resources}
            highlightKeys={activeStep.resourceKeys}
            openKey={reading?.key ?? null}
            onOpen={openResource}
          />
        </div>
        <div className="space-y-2 border-t border-line px-4 py-3 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">{t('workspace.deadline')}</span>
            <DeadlineCountdown deadlineAt={view.session.deadlineAt} />
          </div>
          <RuntimeBadges
            persistenceLabel={view.runtime.persistenceLabel}
            persistenceIsEphemeral={view.runtime.persistenceIsEphemeral}
            aiLabel={view.runtime.aiLabel}
            aiModeDowngraded={view.runtime.aiModeDowngraded}
          />
          <Link
            href={`/admin/events?session=${view.session.id}`}
            className="flex items-center gap-1.5 text-muted transition-colors hover:text-strong"
          >
            <span aria-hidden>📊</span> {t('workspace.inspectEvents')}
          </Link>
        </div>
      </aside>

      {/* Center: the step, written up like a document */}
      <section className="relative flex min-h-0 min-w-0 flex-col bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas/60 px-5 py-2 text-[11px] text-muted">
          <span className="rounded-md border border-line bg-surface px-2 py-0.5 font-medium text-body">
            {view.department.name}
          </span>
          <span className="rounded-md border border-line bg-surface px-2 py-0.5">
            {t(`stepType.${activeStep.stepType}` as MessageKey)}
          </span>
          {activeStep.estimatedMinutes ? (
            <span className="rounded-md border border-line bg-surface px-2 py-0.5">
              ⏱ {t('work.minutes', { minutes: String(activeStep.estimatedMinutes) })}
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-1.5">
            <span>{t('work.autosave')}</span>
            <span className="grid size-4 place-items-center rounded-full bg-accent-500 text-[9px] font-bold text-white">
              ✓
            </span>
          </span>
        </div>

        <div ref={centerRef} className="work-doc min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          <div className="mx-auto max-w-[760px] space-y-4">
            {isComplete ? (
              <Card className="animate-pop border-accent-400/40 bg-accent-500/5 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Badge tone="success" dot>
                      {t('workspace.complete')}
                    </Badge>
                    <p className="mt-2 text-sm text-strong">
                      {t('workspace.submitted', { title: view.scenario.finalOutputTitle })}
                    </p>
                  </div>
                  <Link
                    href="/report"
                    className="rounded-xl border border-accent-400/40 px-3.5 py-2 text-xs font-medium text-accent-400 transition-colors hover:bg-accent-400/10"
                  >
                    {t('workspace.viewReport')}
                  </Link>
                </div>
              </Card>
            ) : null}

            <header className="border-b border-line pb-4">
              <div className="flex items-start gap-3">
                <svg aria-hidden viewBox="0 0 24 24" className="mt-1 size-8 shrink-0 text-strong" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path d="M6 2.5h8l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1-1.5Z" />
                  <path d="M14 2.5V8h5M8.5 12h7M8.5 15.5h7M8.5 9h3" strokeLinecap="round" />
                </svg>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black tracking-tight text-strong">
                    <span className="text-brand-600">TASK {stepNumber}</span>
                    <span className="mx-2 text-subtle">·</span>
                    {activeStep.title}
                  </h2>
                  {activeStep.summary ? (
                    <p className="mt-1 text-[13px] text-muted">{activeStep.summary}</p>
                  ) : null}
                </div>
                <Badge tone={STEP_STATUS_TONE[activeStep.status]} dot>
                  {t(`stepStatus.${activeStep.status}`)}
                </Badge>
              </div>
              {activeStep.instructions ? (
                <p className="mt-3 rounded-lg bg-sunken px-4 py-3 text-[13px] leading-relaxed text-body">
                  {activeStep.instructions}
                </p>
              ) : null}
            </header>

            {!activeStep.unlocked ? (
              <Card className="px-5 py-10 text-center">
                <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-sunken text-base">
                  🔒
                </div>
                <p className="text-sm text-muted">
                  {activeStep.lockedReason ?? t('workspace.locked')}
                </p>
              </Card>
            ) : (
              <>
                {activeStep.eventPayload ? (
                  <EventCard
                    sessionId={view.session.id}
                    stepKey={activeStep.key}
                    payload={activeStep.eventPayload}
                  />
                ) : null}

                {activeStep.media ? <ReferencePanel media={activeStep.media} /> : null}

                {activeStep.tasks.map((task) => (
                  <TaskCard
                    key={task.key}
                    sessionId={view.session.id}
                    step={activeStep}
                    task={task}
                    steps={view.steps}
                    resources={view.resources}
                    personas={view.personas}
                    onSessionUpdate={handleSessionUpdate}
                  />
                ))}

                {activeStep.status === 'completed' && nextStep ? (
                  <div ref={nextStepRef}>
                    <NextStepCard
                      view={view}
                      step={nextStep}
                      onGo={() => goToStep(nextStep.key)}
                      onReturnToOffice={onReturnToOffice}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {reading ? (
          <ResourceReader resource={reading} onClose={() => setReading(null)} />
        ) : null}
      </section>

      {/* Right: today's work and the senior to ask */}
      <aside className="min-h-0 space-y-3 border-line bg-canvas/60 p-3 max-xl:border-t xl:overflow-y-auto xl:border-l">
        <TodayTasks steps={view.steps} activeStepKey={activeStep.key} onSelect={goToStep} />
        <MentorChat
          sessionId={view.session.id}
          step={activeStep}
          personas={view.personas}
          onSessionUpdate={handleSessionUpdate}
        />
      </aside>
    </div>
  );
}

/** A file from the library, opened over the document like a second window. */
function ResourceReader({
  resource,
  onClose,
}: {
  resource: ResourceDefinition;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col bg-surface animate-pop"
      data-testid="resource-reader"
      data-resource-key={resource.key}
    >
      <div className="flex items-center gap-3 border-b border-line bg-[#1d2a4a] px-4 py-2 text-white">
        <FileIcon format={resource.fileMeta?.format ?? 'DOC'} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{resource.title}</span>
          {resource.fileMeta ? (
            <span className="block text-[10px] text-white/60">{resource.fileMeta.detail}</span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium hover:bg-white/20"
        >
          {t('work.backToTask')}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-10">
        <div className="mx-auto max-w-[760px]">
          <p className="mb-4 text-[13px] text-muted">{resource.description}</p>
          <ResourceBodyView resource={resource} />
        </div>
      </div>
    </div>
  );
}

function NextStepCard({
  view,
  step,
  onGo,
  onReturnToOffice,
}: {
  view: SessionView;
  step: StepView;
  onGo: () => void;
  onReturnToOffice?: () => void;
}) {
  const t = useT();
  // A next step handed over by a senior, or set in another room, is picked up
  // by walking there; one at the desk can just carry on here.
  const quest = step.unlocked ? questFor(view, step) : null;
  const elsewhere =
    quest && (quest.target.kind === 'npc' || quest.target.roomKey !== 'my-desk') ? quest : null;
  const where = elsewhere
    ? elsewhere.target.kind === 'npc'
      ? t('game.nextQuestFrom', {
          name: NPCS.find((npc) => npc.key === elsewhere.npcKey)?.name ?? '',
        })
      : t('game.nextQuestOffice', {
          place: t(`office.room.${elsewhere.target.roomKey}` as MessageKey),
        })
    : '';
  return (
    <Card
      className="animate-pop border-accent-400/40 bg-accent-500/5 px-5 py-4"
      data-testid="next-step"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Badge tone="success" dot>
            {t('workspace.stepDone')}
          </Badge>
          <p className="mt-2 text-sm text-strong">
            {step.unlocked
              ? t('workspace.nextStepPrompt', { title: step.title }) +
                (where ? ` · ${where}` : '')
              : t('workspace.nextStepLocked', {
                  reason: step.lockedReason ?? t('workspace.locked'),
                })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {elsewhere && onReturnToOffice ? (
            <Button onClick={onReturnToOffice} data-testid="walk-to-next">
              📍 {t('game.walkThere')}
            </Button>
          ) : null}
          <Button
            onClick={onGo}
            disabled={!step.unlocked}
            variant={elsewhere && onReturnToOffice ? 'ghost' : undefined}
            data-testid="go-next-step"
          >
            {t('workspace.nextStep')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
