/**
 * Checks the 2+1 department recommendation (recommendation-v1).
 *
 *   npm run verify:plan
 *
 * Fails when the recommendation:
 *   - accepts anything but exactly two different, known departments, or an
 *     incomplete pre-survey,
 *   - ever recommends a department the student chose,
 *   - differs for the same answers and the same choices,
 *   - is just the highest Pre-LIKE, where a lower one has a standout area,
 *   - breaks a tie other than by the listed order, or gives no answer when no
 *     candidate shows an interest signal.
 */
import { PS50_ROLE_RUBRICS, type RoleSlug } from '@/content/pre-survey-rubric-v1';
import { planFrom } from '@/services/departments/plan-service';
import {
  RECOMMENDATION_VERSION,
  RecommendationError,
  recommendDepartment,
} from '@/services/departments/recommendation';

const problems: string[] = [];
let checks = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  checks += 1;
  if (!ok) problems.push(detail === undefined ? name : `${name}: ${JSON.stringify(detail)}`);
}
function throwsCode(name: string, fn: () => unknown, code: string) {
  try {
    fn();
    check(name, false, 'did not throw');
  } catch (error) {
    check(name, error instanceof RecommendationError && error.code === code, String(error));
  }
}

const key = (n: number) => `PS50_${String(n).padStart(2, '0')}`;
const ROLES = PS50_ROLE_RUBRICS.map((r) => r.role);
const by = (values: Partial<Record<RoleSlug, number>>, fallback = 3) =>
  Object.fromEntries(
    PS50_ROLE_RUBRICS.flatMap((r) => r.questions.map((n) => [key(n), values[r.role] ?? fallback])),
  ) as Record<string, unknown>;

// ---------------------------------------------------------------- inputs

const full = by({});
throwsCode('one department is not a choice', () => recommendDepartment(full, ['sales']), 'invalid_choice');
throwsCode('three departments are not a choice', () => recommendDepartment(full, ['sales', 'marketing', 'strategy']), 'invalid_choice');
throwsCode('the same department twice is not a choice', () => recommendDepartment(full, ['sales', 'sales']), 'invalid_choice');
throwsCode('an unknown department is not a choice', () => recommendDepartment(full, ['sales', 'finance']), 'invalid_choice');
const partial = { ...full };
delete partial.PS50_50;
throwsCode('an incomplete pre-survey cannot be used', () => recommendDepartment(partial, ['sales', 'marketing']), 'pre_survey_incomplete');

// ---------------------------------------------------------- never a choice

const profiles: Record<string, Record<string, unknown>> = {
  flat: by({}),
  sales: by({ sales: 5, marketing: 4, strategy: 2 }),
  mixed: by({ marketing: 1, strategy: 5, 'product-management': 2, 'human-resources': 4 }),
  low: by({}, 1),
};
for (const [label, answers] of Object.entries(profiles)) {
  for (let i = 0; i < ROLES.length; i++) {
    for (let j = i + 1; j < ROLES.length; j++) {
      const chosen = [ROLES[i], ROLES[j]];
      const first = recommendDepartment(answers, chosen);
      check(`${label} ${chosen}: not one of the two`, !chosen.includes(first.recommended), first.recommended);
      check(`${label} ${chosen}: from the other three`, first.candidates.length === 3);
      const again = recommendDepartment(answers, chosen);
      check(`${label} ${chosen}: deterministic`, JSON.stringify(first) === JSON.stringify(again));
      check(`${label} ${chosen}: versioned`, first.version === RECOMMENDATION_VERSION);
    }
  }
}

// ------------------------------------------------- not just the top Pre-LIKE

// Strategy: 4 across the board (75 overall, nothing stands out).
// PM: mostly 2, but its problem-discovery area (Q41–43) all 5 → overall 47.5, peak 100.
const spiky = by({ strategy: 4, 'product-management': 2, 'human-resources': 1 });
for (const n of [41, 42, 43]) spiky[key(n)] = 5;
const spikyPick = recommendDepartment(spiky, ['sales', 'marketing']);
check('a standout area beats a higher flat overall', spikyPick.recommended === 'product-management', spikyPick.candidates);
check('the higher overall really was Strategy', spikyPick.candidates.find((c) => c.slug === 'strategy')!.overall >
  spikyPick.candidates.find((c) => c.slug === 'product-management')!.overall);
check('the reason is recorded', spikyPick.candidates.find((c) => c.slug === 'product-management')!.peakArea === 'problem_discovery');

// ------------------------------------------------------- ties and no signal

const tie = recommendDepartment(by({}), ['marketing', 'sales']);
// The rubric lists marketing, strategy, sales, human-resources, product-management.
check('a full tie goes to the first candidate in the rubric order', tie.recommended === 'strategy', tie.candidates.map((c) => c.slug));
const none = recommendDepartment(by({}, 1), ['sales', 'marketing']);
check('no interest signal still recommends, and says so', none.basis === 'no-signal' && !['sales', 'marketing'].includes(none.recommended));
const signal = recommendDepartment(by({ 'human-resources': 4 }, 1), ['sales', 'marketing']);
check('a candidate with a signal is preferred', signal.basis === 'signal' && signal.recommended === 'human-resources');

// ------------------------------------------------- confirmed vs. legacy plan

check('no record: not confirmed', planFrom(null).confirmed === false);
const legacy = planFrom({ userId: 'u', departmentSlugs: ['sales', 'strategy', 'marketing'], selectedAt: '2026-01-01T00:00:00Z' });
check(
  'a pre-2+1 selection is kept but is not a confirmed plan',
  legacy.confirmed === false && legacy.legacySlugs.join() === 'sales,strategy,marketing',
);
const confirmed = planFrom({
  userId: 'u',
  departmentSlugs: ['sales', 'marketing', 'strategy'],
  selectedAt: '2026-01-01T00:00:00Z',
  userChosenSlugs: ['sales', 'marketing'],
  aiRecommendedSlug: 'strategy',
  recommendationVersion: RECOMMENDATION_VERSION,
  confirmedAt: '2026-01-01T00:00:00Z',
});
check(
  'a confirmed plan reads as two chosen + one recommended',
  confirmed.confirmed === true &&
    confirmed.departmentSlugs.join() === 'sales,marketing,strategy' &&
    confirmed.aiRecommendedSlug === 'strategy',
);

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} of ${checks} recommendation check(s) failed:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`✓ department recommendation: ${checks} checks passed`);
