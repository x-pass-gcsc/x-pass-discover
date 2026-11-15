/**
 * Checks the final report's "during" and "overall" parts.
 *
 *   npm run verify:report
 *
 * Fails when the behavior analysis:
 *   - counts a document opened twice as two, or misses what was asked,
 *   - notes a pattern the log does not show (revising after a change that
 *     never came, researching before a decision that came first),
 * or when the rules' summary:
 *   - says the order held when it changed (or the reverse),
 *   - misjudges how the recommended department went against the chosen ones,
 *   - talks about a recommendation in a plan of two,
 *   - leaves a placeholder unfilled, in any language.
 */
import { scorePreSurvey50, PS50_ROLE_RUBRICS, type RoleSlug } from '@/content/pre-survey-rubric-v1';
import { DICTIONARIES, translator } from '@/i18n/translate';
import { LOCALES } from '@/i18n/config';
import { analyzeSession } from '@/services/report/behavior-analysis';
import { rulesSynthesisFor, type SynthesisInput } from '@/services/report/synthesis';
import type { BehaviorEvent, CareerPostSurvey, ProjectSession } from '@/types/runtime';

const problems: string[] = [];
let checks = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  checks += 1;
  if (!ok) problems.push(detail === undefined ? name : `${name}: ${JSON.stringify(detail)}`);
}

// ------------------------------------------------------------ behavior

const session: ProjectSession = {
  id: 's1',
  userId: 'u',
  departmentSlug: 'sales',
  projectKey: 'p',
  scenarioKey: 'x',
  scenarioVersion: 1,
  status: 'completed',
  currentStepKey: null,
  startedAt: '2026-01-01T10:00:00.000Z',
  deadlineAt: '2026-01-02T10:00:00.000Z',
  completedAt: '2026-01-01T12:30:00.000Z',
};
let minute = 0;
const ev = (eventType: BehaviorEvent['eventType'], extra: Partial<BehaviorEvent> = {}): BehaviorEvent => ({
  id: `e${minute}`,
  userId: 'u',
  sessionId: 's1',
  departmentSlug: 'sales',
  stepKey: null,
  taskKey: null,
  eventType,
  occurredAt: new Date(Date.parse(session.startedAt) + ++minute * 60_000).toISOString(),
  metadata: {},
  ...extra,
});

const log = [
  ev('resource_opened', { metadata: { resourceKey: 'a' } }),
  ev('resource_opened', { metadata: { resourceKey: 'a' } }),
  ev('resource_opened', { metadata: { resourceKey: 'b' } }),
  ev('ai_conversation_started'),
  ev('ai_message_sent'),
  ev('ai_followup_asked'),
  ev('ai_followup_asked'),
  ev('ai_fact_revealed'),
  ev('decision_submitted', { taskKey: 't' }),
  ev('unexpected_event_viewed'),
  ev('decision_revised', { taskKey: 't' }),
];
const b = analyzeSession(session, log, { completed: 10, total: 10 });
check('a document opened twice counts once', b.resourcesOpened === 2, b);
check('questions include follow-ups', b.questions === 3 && b.followUps === 2, b);
check('elapsed time from start to completion', b.elapsedMinutes === 150, b);
for (const key of ['researched_first', 'asked_followups', 'uncovered_facts', 'revised_after_change'] as const) {
  check(`notes ${key}`, b.observations.includes(key), b.observations);
}
check('does not note reading widely with two documents', !b.observations.includes('read_widely'));

minute = 0;
const quiet = analyzeSession(session, [ev('decision_submitted'), ev('resource_opened'), ev('decision_revised')], { completed: 1, total: 10 });
check('no research before the decision, no note', !quiet.observations.includes('researched_first'), quiet.observations);
check('a revision with no change is not "after a change"', !quiet.observations.includes('revised_after_change'), quiet.observations);
minute = 0;
const held = analyzeSession(session, [ev('decision_submitted'), ev('unexpected_event_viewed')], { completed: 1, total: 1 });
check('kept the decision after a change', held.observations.includes('held_after_change'), held.observations);

// ------------------------------------------------------------ summary

const key = (n: number) => `PS50_${String(n).padStart(2, '0')}`;
const answersBy = (values: Partial<Record<RoleSlug, number>>) =>
  Object.fromEntries(PS50_ROLE_RUBRICS.flatMap((r) => r.questions.map((n) => [key(n), values[r.role] ?? 3])));
const pre = answersBy({ sales: 5, marketing: 4, strategy: 2 });
check('the fixture pre-survey is complete', scorePreSurvey50(pre).complete);

const post = (order: string[], a1: Record<string, number>): CareerPostSurvey =>
  ({
    userId: 'u',
    surveyVersion: 'post-survey-v1.0',
    departmentSlugs: Object.keys(a1),
    departmentAnswers: Object.fromEntries(Object.entries(a1).map(([slug, v]) => [slug, { a1: v }])),
    comparisonAnswers: { b1Mode: 'ranked', b1Order: order, b4: [order[0]], b5: 2 },
    experienceAnswers: {},
    status: 'submitted',
  }) as unknown as CareerPostSurvey;

const plan3 = {
  confirmed: true as const,
  size: 3 as const,
  userChosenSlugs: ['sales', 'marketing'],
  aiRecommendedSlug: 'strategy',
  departmentSlugs: ['sales', 'marketing', 'strategy'],
  recommendationReason: 'reason',
  confirmedAt: '2026-01-01T00:00:00Z',
};
const behaviorFor = (slug: string, questions: number) => ({ ...b, departmentSlug: slug, questions });

for (const locale of LOCALES) {
  const t = translator(DICTIONARIES[locale]);
  const nameOf = (slug: string) => `<${slug}>`;
  const surprise: SynthesisInput = {
    plan: plan3,
    preSurveyAnswers: pre,
    behavior: [behaviorFor('sales', 1), behaviorFor('marketing', 2), behaviorFor('strategy', 9)],
    postSurvey: post(['strategy', 'sales', 'marketing'], { sales: 4, marketing: 3, strategy: 6 }),
  };
  const s1 = rulesSynthesisFor(surprise, t, nameOf);
  const text1 = [s1.headline, ...s1.paragraphs, ...s1.nextSteps].join('\n');
  check(`${locale}: headline names the top of the ranking`, s1.headline.includes('<strategy>'), s1.headline);
  check(`${locale}: the order changed`, text1.includes(t('report.synth.order.changed', { before: '<sales>', after: '<strategy>' })), text1);
  check(`${locale}: the pick was a surprise`, text1.includes(t('report.synth.pick.surprise', { department: '<strategy>' })));
  check(`${locale}: behavior and interest point the same way`, text1.includes(t('report.synth.behavior.match', { department: '<strategy>' })));
  check(`${locale}: low confidence gets a next step`, s1.nextSteps.includes(t('report.synth.next.lowConfidence')));
  check(`${locale}: no placeholder left`, !/\{\w+\}/.test(text1), text1);

  const steady: SynthesisInput = {
    ...surprise,
    postSurvey: post(['sales', 'marketing', 'strategy'], { sales: 6, marketing: 5, strategy: 2 }),
  };
  const s2 = rulesSynthesisFor(steady, t, nameOf);
  check(`${locale}: the order held`, s2.paragraphs.includes(t('report.synth.order.same', { department: '<sales>' })));
  check(`${locale}: the pick confirmed the choice`, s2.paragraphs.includes(t('report.synth.pick.confirmed', { department: '<strategy>' })));
  check(`${locale}: effort and interest differ`, s2.paragraphs.includes(t('report.synth.behavior.differ', { deepest: '<strategy>', liked: '<sales>' })));

  const pair: SynthesisInput = {
    plan: { ...plan3, size: 2, aiRecommendedSlug: null, departmentSlugs: ['sales', 'marketing'], recommendationReason: null },
    preSurveyAnswers: pre,
    behavior: [behaviorFor('sales', 1), behaviorFor('marketing', 2)],
    postSurvey: post(['marketing', 'sales'], { sales: 4, marketing: 6 }),
  };
  const s3 = rulesSynthesisFor(pair, t, nameOf);
  check(`${locale}: a plan of two says there was no pick`, s3.paragraphs.includes(t('report.synth.pick.none')));
  check(`${locale}: a plan of two never mentions a third`, !s3.paragraphs.join().includes('<strategy>'));
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} of ${checks} final-report check(s) failed:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`✓ final report: ${checks} checks passed`);
