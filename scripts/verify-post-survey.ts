/**
 * Checks the post-survey's rules (post-survey-v1.0), shared by form and server.
 *
 *   npm run verify:post-survey
 *
 * Fails when a draft accepts a value it should not (a score outside 1–7 or not
 * a whole number, too many or repeated picks, "none" with another pick, an
 * unknown option, a department outside the plan, text over its limit), or
 * when a final submission's required answers are judged wrongly.
 */
import {
  draftSchema,
  finalIssues,
  progressOf,
  tidyAnswers,
  type DepartmentAnswers,
  type PostSurveyAnswers,
} from '@/content/post-survey';

const problems: string[] = [];
let checks = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  checks += 1;
  if (!ok) problems.push(detail === undefined ? name : `${name}: ${JSON.stringify(detail)}`);
}

const PLAN = ['sales', 'human-resources', 'strategy'];
const dept: DepartmentAnswers = { a1: 6, a2: 5, a3: 4, a4: 7, a5: 4, a6: ['decision'], a7: ['data', 'change'] };
const complete = (): PostSurveyAnswers => ({
  departmentAnswers: { sales: { ...dept }, 'human-resources': { ...dept }, strategy: { ...dept } },
  comparisonAnswers: {
    b1Mode: 'ranked',
    b1Order: ['strategy', 'sales', 'human-resources'],
    b2: ['process'],
    b3: 'unsure',
    b4: ['strategy', 'marketing'],
    b5: 4,
    b6: 6,
    b7: ['practitioners'],
  },
  experienceAnswers: { c1: 6, c2: 'enough', c3: 5, c4: 5, c5: 'right' },
});
const valid = (value: unknown) => draftSchema(PLAN).safeParse(value).success;
const issuesOf = (value: PostSurveyAnswers) => finalIssues(value, PLAN).map((i) => i.path);

// ------------------------------------------------------------- complete

check('a complete survey is a valid draft', valid(complete()));
check('a complete survey has no issues', issuesOf(complete()).length === 0, issuesOf(complete()));
check('an empty draft is valid', valid({ departmentAnswers: {}, comparisonAnswers: {}, experienceAnswers: {} }));

// ------------------------------------------------------------- values

const withDept = (patch: Record<string, unknown>) => {
  const s = complete();
  return { ...s, departmentAnswers: { ...s.departmentAnswers, sales: { ...dept, ...patch } } };
};
for (const bad of [0, 8, 3.5, '3', null]) check(`a score of ${JSON.stringify(bad)} is refused`, !valid(withDept({ a1: bad })));
check('three picks are refused', !valid(withDept({ a6: ['research', 'decision', 'creation'] })));
check('a repeated pick is refused', !valid(withDept({ a6: ['decision', 'decision'] })));
check('"none" with another pick is refused', !valid(withDept({ a7: ['none', 'data'] })));
check('an unknown option is refused', !valid(withDept({ a6: ['dancing'] })));
check('an unknown key is refused', !valid(withDept({ a9: 3 })));
check('text over its limit is refused', !valid(withDept({ a8: 'x'.repeat(1001) })));
check('a department outside the plan is refused', !valid({ ...complete(), departmentAnswers: { ...complete().departmentAnswers, marketing: dept } }));
check('a ranking with a department outside the plan is refused', !valid({ ...complete(), comparisonAnswers: { ...complete().comparisonAnswers, b1Order: ['marketing', 'sales', 'strategy'] } }));
check('a ranking that repeats a department is refused', !valid({ ...complete(), comparisonAnswers: { ...complete().comparisonAnswers, b1Order: ['sales', 'sales', 'strategy'] } }));
check('"not used" is an answer to C3', valid({ ...complete(), experienceAnswers: { ...complete().experienceAnswers, c3: 'not_used' } }));
check('B4 takes any number of jobs, including untried ones', valid({ ...complete(), comparisonAnswers: { ...complete().comparisonAnswers, b4: ['marketing', 'sales', 'strategy', 'product-management'] } }));
check('"decided" stands alone in B7', !valid({ ...complete(), comparisonAnswers: { ...complete().comparisonAnswers, b7: ['decided', 'skills'] } }));

// ------------------------------------------------------------- required

const without = (mutate: (s: PostSurveyAnswers) => void) => {
  const s = complete();
  mutate(s);
  return issuesOf(s);
};
check('a missing A1 for one department is caught', without((s) => delete s.departmentAnswers.strategy.a1).includes('strategy.a1'));
check('a missing department is caught', without((s) => delete s.departmentAnswers['human-resources']).includes('human-resources.a7'));
check('A8 is optional', !without((s) => delete s.departmentAnswers.sales.a8).length);
check('"other" needs its text', without((s) => { s.departmentAnswers.sales.a6 = ['other']; }).includes('sales.a6Other'));
check('a ranking of two is caught', without((s) => { s.comparisonAnswers.b1Order = ['sales', 'strategy']; }).includes('b1'));
check('B2 is required with a ranking', without((s) => delete s.comparisonAnswers.b2).includes('b2'));
check('B2 is not required without one', !without((s) => { s.comparisonAnswers.b1Mode = 'undecided'; delete s.comparisonAnswers.b2; delete s.comparisonAnswers.b1Order; }).length);
check('B3, B4–B7 and C1–C5 are required', ['b3', 'b4', 'b5', 'b6', 'b7', 'c1', 'c2', 'c3', 'c4', 'c5'].every((k) =>
  without((s) => { delete (s.comparisonAnswers as Record<string, unknown>)[k]; delete (s.experienceAnswers as Record<string, unknown>)[k]; }).includes(k)));
check('C6 and C7 are optional', !without((s) => { delete s.experienceAnswers.c6Best; delete s.experienceAnswers.c7; }).length);

// ------------------------------------------------------------- tidy + progress

const tidied = tidyAnswers({ ...complete(), comparisonAnswers: { ...complete().comparisonAnswers, b1Mode: 'none', b3: 'nothing', b3Text: 'x' } });
check('without a ranking, its order and B2 are dropped', tidied.comparisonAnswers.b1Order === undefined && tidied.comparisonAnswers.b2 === undefined);
check('B3 text is dropped unless "yes"', tidied.comparisonAnswers.b3Text === undefined);
const progress = progressOf(complete(), PLAN);
check('a complete survey shows full progress', progress.done === progress.total, progress);
const empty = progressOf({ departmentAnswers: {}, comparisonAnswers: {}, experienceAnswers: {} }, PLAN);
check('an empty survey shows no progress', empty.done === 0 && empty.total > 0, empty);

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} of ${checks} post-survey check(s) failed:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`✓ post-survey rules: ${checks} checks passed`);
