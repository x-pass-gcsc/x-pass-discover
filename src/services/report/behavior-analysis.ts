import 'server-only';
import { getRepository } from '@/db/repository';
import type { BehaviorEvent, ProjectSession } from '@/types/runtime';

/**
 * What the student did inside each bootcamp, read back from the behavior
 * log — for the "during" part of the final report.
 *
 * These are observations, never points (see `services/events`). Counts are
 * shown as facts ("opened 5 resources"), and the few pattern notes below are
 * descriptions of HOW the student worked, each with the evidence behind it.
 * Nothing here is added up, ranked as better or worse, or turned into a
 * SKILL FIT rating.
 */
export type ObservationKey =
  | 'researched_first'
  | 'read_widely'
  | 'asked_followups'
  | 'uncovered_facts'
  | 'revised_after_change'
  | 'held_after_change'
  | 'heeded_guardrail';

export type DepartmentBehavior = {
  departmentSlug: string;
  sessionId: string;
  /** Wall-clock time from start to completion, in minutes; breaks included. */
  elapsedMinutes: number | null;
  stepsCompleted: number;
  stepsTotal: number;
  /** Different documents opened at least once. */
  resourcesOpened: number;
  conversations: number;
  /** Messages the student sent to AI colleagues. */
  questions: number;
  /** Of those, the ones that followed up on the previous answer. */
  followUps: number;
  /** Facts an AI colleague shared only because the student asked. */
  factsUncovered: number;
  unexpectedEvents: number;
  revisions: number;
  guardrailWarnings: number;
  observations: ObservationKey[];
};

const count = (events: BehaviorEvent[], ...types: BehaviorEvent['eventType'][]) =>
  events.filter((e) => types.includes(e.eventType)).length;

const firstAt = (events: BehaviorEvent[], type: BehaviorEvent['eventType']) =>
  events.find((e) => e.eventType === type)?.occurredAt ?? null;

/** Reads one session's log into facts and pattern notes. */
export function analyzeSession(
  session: ProjectSession,
  events: BehaviorEvent[],
  steps: { completed: number; total: number },
): DepartmentBehavior {
  const ordered = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const resourcesOpened = new Set(
    ordered
      .filter((e) => e.eventType === 'resource_opened')
      .map((e) => String(e.metadata.resourceKey ?? e.id)),
  ).size;
  const questions = count(ordered, 'ai_message_sent', 'ai_followup_asked');
  const followUps = count(ordered, 'ai_followup_asked');
  const factsUncovered = count(ordered, 'ai_fact_revealed');
  const unexpectedEvents = count(ordered, 'unexpected_event_viewed');
  const revisions = count(ordered, 'decision_revised');
  const guardrailWarnings = count(ordered, 'guardrail_warning_shown');

  const firstDecision = firstAt(ordered, 'decision_submitted');
  const firstChange = firstAt(ordered, 'unexpected_event_viewed');
  const before = (at: string | null) => (e: BehaviorEvent) => !at || e.occurredAt < at;
  const researchedBeforeDeciding =
    !!firstDecision &&
    ordered
      .filter(before(firstDecision))
      .some((e) => e.eventType === 'resource_opened' || e.eventType === 'ai_message_sent' || e.eventType === 'ai_followup_asked');
  const revisedAfterChange =
    !!firstChange && ordered.some((e) => e.eventType === 'decision_revised' && e.occurredAt > firstChange);
  // A warning followed by a later submission of the same task: they came back to it.
  const heededGuardrail = ordered.some(
    (warning) =>
      warning.eventType === 'guardrail_warning_shown' &&
      ordered.some(
        (e) =>
          e.eventType === 'task_submitted' &&
          e.taskKey === warning.taskKey &&
          e.occurredAt > warning.occurredAt,
      ),
  );

  const observations: ObservationKey[] = [];
  if (researchedBeforeDeciding) observations.push('researched_first');
  if (resourcesOpened >= 4) observations.push('read_widely');
  if (followUps >= 2) observations.push('asked_followups');
  if (factsUncovered >= 1) observations.push('uncovered_facts');
  if (revisedAfterChange) observations.push('revised_after_change');
  else if (firstChange && firstDecision) observations.push('held_after_change');
  if (heededGuardrail) observations.push('heeded_guardrail');

  const elapsed =
    session.completedAt && session.startedAt
      ? Math.round((Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 60000)
      : null;

  return {
    departmentSlug: session.departmentSlug,
    sessionId: session.id,
    elapsedMinutes: elapsed !== null && elapsed >= 0 ? elapsed : null,
    stepsCompleted: steps.completed,
    stepsTotal: steps.total,
    resourcesOpened,
    conversations: count(ordered, 'ai_conversation_started'),
    questions,
    followUps,
    factsUncovered,
    unexpectedEvents,
    revisions,
    guardrailWarnings,
    observations,
  };
}

/**
 * The behavior of each plan department, from its completed session — in
 * the plan's order. A department with no completed session is left out.
 */
export async function analyzePlanBehavior(
  userId: string,
  planSlugs: string[],
): Promise<DepartmentBehavior[]> {
  const repo = getRepository();
  const sessions = await repo.listSessionsForUser(userId);
  const result: DepartmentBehavior[] = [];
  for (const slug of planSlugs) {
    const session = sessions.find((s) => s.departmentSlug === slug && s.status === 'completed');
    if (!session) continue;
    const [events, progress] = await Promise.all([
      repo.listEvents({ sessionId: session.id, limit: 5000 }),
      repo.listStepProgress(session.id),
    ]);
    result.push(
      analyzeSession(session, events, {
        completed: progress.filter((p) => p.status === 'completed').length,
        total: progress.length,
      }),
    );
  }
  return result;
}
