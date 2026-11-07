/**
 * Checks the PS50 Pre-LIKE rubric and how the app reads it.
 *
 *   npm run verify:rubric
 *
 * Fails when:
 *   - the rubric's question numbers, roles or areas stop matching the 50
 *     pre-survey questions (every question in exactly one role and one area),
 *   - a fixed answer does not score 1 → 0, 2 → 25, 3 → 50, 4 → 75, 5 → 100,
 *   - a missing or invalid answer still produces any score,
 *   - answers to an earlier survey change a PS50 score, or PS50 answers are
 *     mixed into the earlier survey's 20–100 LIKE,
 *   - ties at third place are not all kept as exploration candidates,
 *   - the "new pre-survey" notice would show for the wrong records.
 */
import {
  PRE_SURVEY_QUESTIONS,
  isFromEarlierSurvey,
  likeForDepartment,
  preLikeSource,
} from '@/content/pre-survey';
import {
  PS50_ROLE_RUBRICS,
  scoreDepartmentLikeV1,
  scorePreSurvey50,
  type RoleSlug,
} from '@/content/pre-survey-rubric-v1';

const problems: string[] = [];
let checks = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  checks += 1;
  if (!ok) problems.push(detail === undefined ? name : `${name}: ${JSON.stringify(detail)}`);
}

const key = (n: number) => `PS50_${String(n).padStart(2, '0')}`;
const ROLES = PS50_ROLE_RUBRICS.map((r) => r.role);
/** Every answer for a role set to that role's value. */
const answersBy = (values: Record<RoleSlug, number>) =>
  Object.fromEntries(
    PS50_ROLE_RUBRICS.flatMap((r) => r.questions.map((n) => [key(n), values[r.role]])),
  ) as Record<string, unknown>;
const all = (v: number) => answersBy(Object.fromEntries(ROLES.map((r) => [r, v])) as Record<RoleSlug, number>);

// ------------------------------------------------------------- structure

const numbers = PS50_ROLE_RUBRICS.flatMap((r) => r.questions);
check('the rubric covers questions 1–50 once each', [...numbers].sort((a, b) => a - b).join() === Array.from({ length: 50 }, (_, i) => i + 1).join());
for (const role of PS50_ROLE_RUBRICS) {
  const inAreas = role.dimensions.flatMap((d) => d.questions);
  check(`${role.role}: three areas`, role.dimensions.length === 3);
  check(`${role.role}: areas cover its ten questions once each`, [...inAreas].sort((a, b) => a - b).join() === [...role.questions].sort((a, b) => a - b).join());
  for (const n of role.questions) {
    const question = PRE_SURVEY_QUESTIONS.find((q) => q.key === key(n));
    check(`${key(n)} exists in the survey`, !!question);
    check(
      `${key(n)} belongs to ${role.role} in both the survey and the rubric`,
      question?.kind === 'scale' && question.measures?.department === role.role,
      question?.kind === 'scale' ? question.measures?.department : question?.kind,
    );
  }
}
check('the survey has exactly the 50 rubric keys', PRE_SURVEY_QUESTIONS.length === 50 && PRE_SURVEY_QUESTIONS.every((q) => numbers.map(key).includes(q.key)));

// ------------------------------------------------------------- scale

for (const [value, expected] of [[1, 0], [2, 25], [3, 50], [4, 75], [5, 100]] as const) {
  const score = scorePreSurvey50(all(value));
  check(`all ${value}s: complete`, score.complete && score.completedQuestions === 50);
  for (const role of ROLES) {
    check(`all ${value}s: ${role} = ${expected}`, score.roles[role].index0to100 === expected, score.roles[role].index0to100);
    check(`all ${value}s: ${role} areas = ${expected}`, score.roles[role].dimensions.length === 3 && score.roles[role].dimensions.every((d) => d.index0to100 === expected));
    check(`all ${value}s: likeForDepartment(${role}) = ${expected}`, likeForDepartment(all(value), role) === expected);
  }
}

// ------------------------------------------------------------- incomplete / invalid

for (const [label, patch] of [
  ['one answer missing', { PS50_37: undefined }],
  ['an answer of 0', { PS50_01: 0 }],
  ['an answer of 6', { PS50_50: 6 }],
  ['an answer of 2.5', { PS50_12: 2.5 }],
  ['an answer of "3"', { PS50_25: '3' }],
  ['an answer of null', { PS50_44: null }],
] as const) {
  const answers: Record<string, unknown> = { ...all(4), ...patch };
  if ('PS50_37' in patch) delete answers.PS50_37;
  const score = scorePreSurvey50(answers);
  check(`${label}: not complete`, !score.complete);
  check(`${label}: every role score is null`, ROLES.every((r) => score.roles[r].index0to100 === null && score.roles[r].dimensions.length === 0));
  check(`${label}: no ranking`, score.explorationCandidates.length === 0 && score.similarTopScores === null);
  check(`${label}: likeForDepartment is null everywhere`, ROLES.every((r) => likeForDepartment(answers, r) === null && scoreDepartmentLikeV1(answers, r) === null));
}

// ------------------------------------------------------------- versions are never mixed

const legacyKeys = { SAL_01: 1, SAL_02: 1, MKT_01: 5, interest_strategy: 1 };
const mixed = { ...all(3), ...legacyKeys };
check('earlier answers do not change a PS50 score', ROLES.every((r) => likeForDepartment(mixed, r) === 50));
check('a record with PS50 answers is scored as PS50', preLikeSource(mixed) === 'ps50-v1');
const partialWithLegacy = { PS50_21: 5, ...legacyKeys };
check('partial PS50 + earlier answers: no score, no fallback to the old one', ROLES.every((r) => likeForDepartment(partialWithLegacy, r) === null));
check('earlier answers alone are scored the old way (20–100)', likeForDepartment({ SAL_01: 5, SAL_02: 3 }, 'sales') === 80 && likeForDepartment({ interest_sales: 1 }, 'sales') === 20);
check('earlier answers alone are labelled legacy', preLikeSource({ HR_03: 4 }) === 'legacy' && preLikeSource({ interest_sales: 2 }) === 'legacy');
check('an empty record has no source', preLikeSource({}) === null && preLikeSource(undefined) === null);

// The "new pre-survey" notice: for a record with only earlier answers, never
// for one with the current answers (whatever earlier ones it also keeps).
check('notice: earlier answers only', isFromEarlierSurvey({ SAL_01: 5, MKT_01: 2 }) && isFromEarlierSurvey({ interest_sales: 3 }));
check('notice: not once the PS50 answers are in', !isFromEarlierSurvey(mixed) && !isFromEarlierSurvey(all(4)));

// ------------------------------------------------------------- exploration candidates

const ranked = scorePreSurvey50(answersBy({ marketing: 5, strategy: 4, sales: 3, 'human-resources': 3, 'product-management': 1 }));
check('ties at third place are all candidates', [...ranked.explorationCandidates].sort().join() === ['human-resources', 'marketing', 'sales', 'strategy'].join(), ranked.explorationCandidates);
check('top two 25 apart are not similar', ranked.similarTopScores === false);
const flat = scorePreSurvey50(all(3));
check('all equal: every role is a candidate', flat.explorationCandidates.length === 5);
check('all equal: top two are similar', flat.similarTopScores === true);
const clear = scorePreSurvey50(answersBy({ marketing: 5, strategy: 4, sales: 3, 'human-resources': 2, 'product-management': 1 }));
check('no tie: exactly three candidates', clear.explorationCandidates.join() === 'marketing,strategy,sales', clear.explorationCandidates);
const areas = scorePreSurvey50({ ...all(3), PS50_27: 5, PS50_28: 5 });
check('an area is scored from its own questions', areas.roles.sales.dimensions.find((d) => d.code === 'initiative_resilience')?.index0to100 === 100 && areas.roles.sales.index0to100 === 60);

// ------------------------------------------------------------- report

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} of ${checks} rubric check(s) failed:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`✓ PS50 rubric: ${checks} checks passed`);
