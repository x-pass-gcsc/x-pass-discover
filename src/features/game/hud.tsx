'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/i18n/client';
import type { MessageKey } from '@/i18n/messages/en';
import type { PublicPersona } from '@/types/ai';
import {
  BADGES,
  earnedBadges,
  levelFor,
  rankKeyForLevel,
  xpFor,
  type Quest,
  type Reward,
} from './progress';
import type { SessionView } from '@/types/session-view';

/**
 * The game HUD drawn over the office: the player's level, the quest tracker,
 * the badge shelf, the reward burst and the NPC dialogue box. All of it is
 * React reading the session view; Phaser only draws the marker it is told to.
 */

const PANEL = 'rounded-xl border border-white/10 bg-[#1d2433]/92 text-white shadow-float';

export function PlayerHud({
  view,
  playerName,
  onBadges,
}: {
  view: SessionView;
  playerName: string;
  onBadges: () => void;
}) {
  const t = useT();
  const info = levelFor(xpFor(view));
  const badges = earnedBadges(view);
  return (
    <div className={`${PANEL} w-[236px] p-2.5`} data-testid="player-hud" data-level={info.level} data-xp={info.xp}>
      <div className="flex items-center gap-2.5">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-warn-400 to-warn-600 text-[13px] font-black shadow-inner">
          {info.level}
          <span className="absolute -bottom-1.5 rounded bg-[#141a26] px-1 text-[8px] font-semibold tracking-wider text-warn-300">
            LV
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold">{playerName}</span>
          <span className="block truncate text-[10px] text-warn-300">{t(info.rankKey)}</span>
        </span>
        <button
          type="button"
          onClick={onBadges}
          className="pointer-events-auto shrink-0 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-medium hover:bg-white/20"
          data-testid="badge-button"
        >
          🏅 {badges.size}/{BADGES.length}
        </button>
      </div>
      <div className="mt-2.5">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-warn-400 to-warn-300"
            style={{
              width: `${Math.round(info.ratio * 100)}%`,
              transition: 'width 700ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-white/60">
          <span className="font-mono">{t('game.xp', { xp: String(info.xp) })}</span>
          <span>
            {info.levelSpan
              ? t('game.xpToNext', { xp: String(info.levelSpan - info.intoLevel) })
              : t('game.xpMax')}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Points from the player to the quest, the way a compass would. */
function Compass({
  player,
  quest,
}: {
  player: { x: number; y: number } | null;
  quest: Quest;
}) {
  const t = useT();
  if (!player) return null;
  // The player is reported by tile; measure from the tile's centre.
  const dx = quest.target.x - (player.x + 0.5);
  const dy = quest.target.y - (player.y + 0.5);
  const distance = Math.round(Math.hypot(dx, dy));
  if (distance <= 2) {
    return (
      <span className="shrink-0 animate-pop rounded-md bg-accent-500 px-2 py-1 text-[10px] font-semibold text-white">
        {t('game.arrived')}
      </span>
    );
  }
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted">
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="size-5 text-warn-500"
        style={{ transform: `rotate(${angle}deg)`, transition: 'transform 250ms ease-out' }}
      >
        <path d="M3 10h11M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-mono">{t('game.distance', { meters: String(distance) })}</span>
    </span>
  );
}

export function QuestTracker({
  view,
  quest,
  placeName,
  npcName,
  player,
  onStart,
}: {
  view: SessionView | null;
  quest: Quest | null;
  placeName: string;
  npcName: string | null;
  player: { x: number; y: number } | null;
  onStart: () => void;
}) {
  const t = useT();
  if (!view) {
    return (
      <div className="pointer-events-none rounded-xl border border-white/70 bg-surface/95 px-4 py-2.5 shadow-float">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-600">
          {t('office.visitorMode')}
        </span>
        <span className="block text-sm font-semibold text-strong">{t('office.explore')}</span>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-accent-400/50 bg-surface/95 py-2 pl-3 pr-2 shadow-float" data-testid="office-mission">
        <span aria-hidden className="text-xl">🏆</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-accent-600">
            {t('game.questDone')}
          </span>
          <span className="block truncate text-sm font-semibold text-strong">
            {view.scenario.finalOutputTitle}
          </span>
        </span>
        <a
          href="/report"
          className="shrink-0 rounded-lg bg-accent-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-accent-600"
        >
          {t('game.viewReport')}
        </a>
      </div>
    );
  }

  const where = npcName ? t('game.talkTo', { name: npcName }) : t('game.goTo', { place: placeName });
  return (
    <div
      className="flex items-center gap-3 rounded-xl border-2 border-warn-400/70 bg-surface/95 py-2 pl-2.5 pr-2 shadow-float"
      data-testid="office-mission"
      data-quest-step={quest.step.key}
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 animate-[pulse_2s_ease-in-out_infinite] place-items-center rounded-full bg-warn-500 text-lg font-black text-white"
      >
        !
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-warn-600">
          {t('game.quest', {
            number: String(quest.index + 1),
            total: String(view.steps.length),
          })}
        </span>
        <span className="block truncate text-sm font-semibold text-strong">{quest.step.title}</span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className="truncate text-[11px] text-body">📍 {where}</span>
          <Compass player={player} quest={quest} />
        </span>
      </span>
      <button
        type="button"
        onClick={onStart}
        data-testid="open-work"
        className="shrink-0 self-stretch rounded-lg bg-brand-500 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-brand-600"
      >
        {t('game.startNow')}
      </button>
    </div>
  );
}

export function BadgeShelf({ view }: { view: SessionView }) {
  const t = useT();
  const earned = earnedBadges(view);
  return (
    <div className="space-y-3 p-5" data-testid="badge-shelf">
      <ul className="grid grid-cols-2 gap-2">
        {BADGES.map((badge) => {
          const has = earned.has(badge.key);
          return (
            <li
              key={badge.key}
              data-badge={badge.key}
              data-earned={has ? 'true' : 'false'}
              className={`rounded-xl border p-2.5 ${
                has ? 'border-warn-300 bg-warn-50' : 'border-line bg-sunken opacity-60'
              }`}
            >
              <span className={`text-xl ${has ? '' : 'grayscale'}`} aria-hidden>
                {has ? badge.icon : '🔒'}
              </span>
              <span className="mt-1 block text-[11px] font-semibold text-strong">
                {t(`game.badge.${badge.key}` as MessageKey)}
              </span>
              <span className="block text-[10px] leading-snug text-muted">
                {t(`game.badge.${badge.key}.desc` as MessageKey)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] leading-relaxed text-subtle">{t('game.xpNote')}</p>
    </div>
  );
}

/**
 * The burst shown when work is finished. It never takes the pointer, so the
 * student can keep clicking straight through it, and it fades by itself.
 */
export function RewardBurst({ reward, onDone }: { reward: Reward; onDone: () => void }) {
  const t = useT();
  const [count, setCount] = useState(0);
  const big = reward.completedSteps.length > 0 || reward.bootcampCompleted;

  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / 700);
      setCount(Math.round(reward.xpGained * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const timer = setTimeout(onDone, big ? 3600 : 2200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [reward, big, onDone]);

  const levelUp = reward.levelAfter > reward.levelBefore;

  if (!big) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex justify-center" data-testid="reward-burst">
        <span className="animate-pop rounded-full border border-warn-300 bg-[#1d2433] px-4 py-2 text-sm font-bold text-warn-300 shadow-float">
          ✓ {t('game.taskDone')} · +{count} XP
        </span>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] grid place-items-center"
      data-testid="reward-burst"
      data-big="true"
    >
      <div className="relative animate-pop text-center">
        <Confetti />
        <p className="text-[44px] font-black italic leading-none tracking-tight text-warn-400 drop-shadow-[0_4px_0_#1d2433] [-webkit-text-stroke:2px_#1d2433]">
          {reward.bootcampCompleted ? t('game.bootcampClear') : t('game.stepClear')}
        </p>
        {reward.completedSteps[0] ? (
          <p className="mt-2 inline-block rounded-lg bg-[#1d2433]/90 px-3 py-1 text-sm font-semibold text-white">
            {reward.completedSteps[0].title}
          </p>
        ) : null}
        <p className="mx-auto mt-3 w-fit rounded-xl bg-[#1d2433]/90 px-4 py-1 font-mono text-3xl font-black text-warn-300">
          +{count} XP
        </p>
        {levelUp ? (
          <p className="mx-auto mt-3 w-fit animate-pop rounded-full bg-gradient-to-r from-warn-500 to-danger-500 px-4 py-1.5 text-sm font-bold text-white shadow-float">
            ⬆ {t('game.levelUp', {
              level: String(reward.levelAfter),
              rank: t(rankKeyForLevel(reward.levelAfter)),
            })}
          </p>
        ) : null}
        {reward.newBadges.map((key) => (
          <p
            key={key}
            className="mx-auto mt-2 w-fit rounded-full border border-warn-300 bg-warn-50 px-3 py-1 text-xs font-semibold text-warn-700 shadow-card"
          >
            {BADGES.find((b) => b.key === key)?.icon}{' '}
            {t('game.newBadge', { name: t(`game.badge.${key}` as MessageKey) })}
          </p>
        ))}
      </div>
    </div>
  );
}

const CONFETTI_COLOURS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#a855f7', '#fde047'];

function Confetti() {
  return (
    <span aria-hidden className="absolute left-1/2 top-1/2 -z-10">
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const reach = 140 + (i % 5) * 28;
        return (
          <span
            key={i}
            className="absolute block h-2.5 w-1.5 rounded-sm"
            style={{
              background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
              animation: `confetti 1.6s cubic-bezier(0.22,1,0.36,1) ${i * 12}ms both`,
              ['--dx' as string]: `${Math.cos(angle) * reach}px`,
              ['--dy' as string]: `${Math.sin(angle) * reach * 0.7}px`,
              ['--rot' as string]: `${(i * 67) % 360}deg`,
            }}
          />
        );
      })}
    </span>
  );
}

/** The RPG-style box a senior speaks in when they hand over a step. */
export function NpcDialogue({
  name,
  role,
  persona,
  line,
  onAccept,
  onAsk,
  onLater,
}: {
  name: string;
  role: string;
  persona: PublicPersona | undefined;
  line: string;
  onAccept: () => void;
  onAsk: (() => void) | null;
  onLater: () => void;
}) {
  const t = useT();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= line.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 22);
    return () => clearInterval(id);
  }, [line]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onLater();
      if (event.key === 'Enter') onAccept();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAccept, onLater]);

  return (
    <div
      className="absolute inset-x-4 bottom-4 z-20 mx-auto max-w-[680px] animate-fade-up"
      data-testid="npc-dialogue"
    >
      <div className="flex gap-3 rounded-2xl border-[3px] border-[#1d2433] bg-surface p-3 shadow-float">
        <span className="size-16 shrink-0 overflow-hidden rounded-xl border-2 border-[#1d2433] bg-sunken">
          {persona?.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={persona.portrait} alt="" className="size-full object-cover" />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-600">
            {name} <span className="font-normal text-muted">· {role}</span>
          </p>
          <p className="mt-1 min-h-[2.6em] text-sm leading-relaxed text-strong">
            {line.slice(0, shown)}
            {shown < line.length ? <span className="animate-pulse">▍</span> : null}
          </p>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onLater}
              className="rounded-lg px-3 py-1.5 text-[11px] text-muted hover:bg-sunken"
            >
              {t('game.dialogue.later')}
            </button>
            {onAsk ? (
              <button
                type="button"
                onClick={onAsk}
                className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-medium text-body hover:bg-sunken"
              >
                {t('game.dialogue.ask')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onAccept}
              data-testid="accept-quest"
              className="rounded-lg bg-warn-500 px-4 py-1.5 text-[11px] font-bold text-white shadow-card hover:bg-warn-600"
            >
              ▶ {t('game.dialogue.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
