import { NPCS, ROOMS } from '@/game/office/map';
import type { StepType } from '@/types/scenario';
import type { SessionView, StepView } from '@/types/session-view';

/**
 * The game layer's reading of a session: XP, level, badges and the next quest.
 *
 * Everything here is derived from what the student has *finished* — completed
 * tasks and steps — and nothing else. It is a progress meter, not an
 * evaluation: time spent, messages sent and files opened never earn XP, and
 * none of it feeds LIKE or SKILL FIT. Because it is recomputed from the
 * session view, it needs no storage and cannot drift from the real state.
 */

export const XP_PER_TASK = 40;
export const XP_PER_STEP = 100;
export const XP_BOOTCAMP_BONUS = 300;

/** Cumulative XP needed to reach each level; index 0 is level 1. */
const LEVEL_THRESHOLDS = [0, 150, 350, 600, 900, 1250, 1650, 2100, 2600];

/** Titles by level, as message keys. The last one holds for every level after it. */
export const RANK_KEYS = [
  'game.rank.1',
  'game.rank.2',
  'game.rank.3',
  'game.rank.4',
  'game.rank.5',
  'game.rank.6',
  'game.rank.7',
  'game.rank.8',
  'game.rank.9',
] as const;

export type LevelInfo = {
  xp: number;
  level: number;
  /** XP into the current level, and how much the level spans. */
  intoLevel: number;
  levelSpan: number;
  /** 0–1 progress to the next level; 1 at the cap. */
  ratio: number;
  rankKey: (typeof RANK_KEYS)[number];
};

export function xpFor(view: SessionView): number {
  let xp = 0;
  for (const step of view.steps) {
    for (const task of step.tasks) if (task.status === 'complete') xp += XP_PER_TASK;
    if (step.status === 'completed') xp += XP_PER_STEP;
  }
  if (view.session.status === 'completed') xp += XP_BOOTCAMP_BONUS;
  return xp;
}

export const rankKeyForLevel = (level: number) =>
  RANK_KEYS[Math.min(Math.max(level, 1), RANK_KEYS.length) - 1]!;

export function levelFor(xp: number): LevelInfo {
  let index = 0;
  while (index + 1 < LEVEL_THRESHOLDS.length && xp >= LEVEL_THRESHOLDS[index + 1]!) index += 1;
  const floor = LEVEL_THRESHOLDS[index]!;
  const ceiling = LEVEL_THRESHOLDS[index + 1];
  const span = ceiling === undefined ? 0 : ceiling - floor;
  return {
    xp,
    level: index + 1,
    intoLevel: xp - floor,
    levelSpan: span,
    ratio: span === 0 ? 1 : (xp - floor) / span,
    rankKey: rankKeyForLevel(index + 1),
  };
}

/**
 * Badges, one per kind of work. Step types are shared by every department, so
 * the same badges mean the same thing in Sales and in HR.
 */
export type Badge = {
  key: string;
  icon: string;
  /** Earned when any step of these types is complete. */
  stepTypes?: StepType[];
  /** Earned when this many steps are complete. */
  stepsCompleted?: number;
  /** Earned when the bootcamp is complete. */
  bootcamp?: true;
};

export const BADGES: Badge[] = [
  { key: 'first-step', icon: '🚪', stepsCompleted: 1 },
  { key: 'trained', icon: '📘', stepTypes: ['training', 'briefing'] },
  { key: 'researcher', icon: '🔎', stepTypes: ['research', 'analysis'] },
  { key: 'meeting', icon: '🤝', stepTypes: ['ai_interaction'] },
  { key: 'decision', icon: '🧭', stepTypes: ['decision'] },
  { key: 'curveball', icon: '⚡', stepTypes: ['unexpected_event', 'revision'] },
  { key: 'halfway', icon: '⛰️', stepsCompleted: 5 },
  { key: 'graduate', icon: '🏆', bootcamp: true },
];

export function earnedBadges(view: SessionView): Set<string> {
  const done = view.steps.filter((step) => step.status === 'completed');
  const earned = new Set<string>();
  for (const badge of BADGES) {
    if (badge.bootcamp && view.session.status === 'completed') earned.add(badge.key);
    if (badge.stepsCompleted && done.length >= badge.stepsCompleted) earned.add(badge.key);
    if (badge.stepTypes && done.some((step) => badge.stepTypes!.includes(step.stepType))) {
      earned.add(badge.key);
    }
  }
  return earned;
}

/**
 * Where in the office the next piece of work is picked up. `x`/`y` are in
 * continuous tile units: a person's tile centre, or a room's middle.
 */
export type QuestTarget =
  | { kind: 'npc'; npcKey: string; x: number; y: number }
  | { kind: 'room'; roomKey: string; x: number; y: number };

export type Quest = {
  step: StepView;
  index: number;
  target: QuestTarget;
  /** The NPC who hands this step over or holds its conversation, if any. */
  npcKey: string | null;
  /** True when talking to `npcKey` is itself the work (a conversation task). */
  isConversation: boolean;
};

/** The step the student should do next: the current one, else the first open one. */
export function currentQuestStep(view: SessionView): StepView | undefined {
  if (view.session.status === 'completed') return undefined;
  return (
    view.steps.find(
      (step) =>
        step.key === view.session.currentStepKey && step.unlocked && step.status !== 'completed',
    ) ?? view.steps.find((step) => step.unlocked && step.status !== 'completed')
  );
}

const roomCentre = (roomKey: string) => {
  const room = ROOMS.find((r) => r.key === roomKey);
  return room ? { x: room.x + room.w / 2, y: room.y + room.h / 2 } : null;
};

function npcInRoom(roomKey: string | null, personaKeys: Set<string>) {
  const room = ROOMS.find((r) => r.key === roomKey);
  if (!room) return undefined;
  return NPCS.find(
    (npc) =>
      npc.personaKey &&
      personaKeys.has(npc.personaKey) &&
      npc.x >= room.x &&
      npc.x < room.x + room.w &&
      npc.y >= room.y &&
      npc.y < room.y + room.h,
  );
}

/**
 * Turns a step into a place to go.
 *
 * A conversation step points at the person you talk to. A step set in a room
 * where one of this bootcamp's seniors stands points at that senior, who hands
 * the work over. Any other step points at its room (the desk, the Data Room,
 * the notice board), and a step with no room at all at the desk.
 */
export function questFor(view: SessionView, step: StepView): Quest {
  const index = view.steps.indexOf(step);
  const personaKeys = new Set(view.personas.map((p) => p.key));

  const talk = step.tasks.find(
    (task) => task.kind === 'ai_conversation' && task.personaKey && task.status !== 'complete',
  );
  const talker = talk ? NPCS.find((npc) => npc.personaKey === talk.personaKey) : undefined;
  if (talker) {
    return {
      step,
      index,
      target: { kind: 'npc', npcKey: talker.key, x: talker.x + 0.5, y: talker.y + 0.5 },
      npcKey: talker.key,
      isConversation: true,
    };
  }

  const room = ROOMS.find((r) => r.key === step.officeZoneKey);
  const senior = npcInRoom(step.officeZoneKey, personaKeys);
  if (senior && room?.action.kind === 'info') {
    return {
      step,
      index,
      target: { kind: 'npc', npcKey: senior.key, x: senior.x + 0.5, y: senior.y + 0.5 },
      npcKey: senior.key,
      isConversation: false,
    };
  }

  const roomKey = room && room.action.kind !== 'info' ? room.key : 'my-desk';
  const centre = roomCentre(roomKey) ?? { x: 0, y: 0 };
  return {
    step,
    index,
    target: { kind: 'room', roomKey, ...centre },
    npcKey: null,
    isConversation: false,
  };
}

export function currentQuest(view: SessionView | null): Quest | null {
  if (!view) return null;
  const step = currentQuestStep(view);
  return step ? questFor(view, step) : null;
}

/** What changed between two views, for the reward screen. */
export type Reward = {
  xpGained: number;
  completedSteps: StepView[];
  levelBefore: number;
  levelAfter: number;
  newBadges: string[];
  bootcampCompleted: boolean;
};

export function rewardBetween(before: SessionView, after: SessionView): Reward | null {
  const xpBefore = xpFor(before);
  const xpAfter = xpFor(after);
  if (xpAfter <= xpBefore) return null;
  const wasDone = new Set(
    before.steps.filter((s) => s.status === 'completed').map((s) => s.key),
  );
  const badgesBefore = earnedBadges(before);
  return {
    xpGained: xpAfter - xpBefore,
    completedSteps: after.steps.filter((s) => s.status === 'completed' && !wasDone.has(s.key)),
    levelBefore: levelFor(xpBefore).level,
    levelAfter: levelFor(xpAfter).level,
    newBadges: [...earnedBadges(after)].filter((key) => !badgesBefore.has(key)),
    bootcampCompleted:
      before.session.status !== 'completed' && after.session.status === 'completed',
  };
}
