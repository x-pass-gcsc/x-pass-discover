import {
  PS50_ROLE_RUBRICS,
  scorePreSurvey50,
  type RoleSlug,
} from '@/content/pre-survey-rubric-v1';

/**
 * The third department: recommended, not chosen.
 *
 * The student picks two departments; this picks one of the other three for
 * them, from their pre-survey, as a direction worth trying that they did not
 * reach for themselves. It reads the PS50 rubric's scores (`scorePreSurvey50`)
 * and nothing else, and it is deterministic: the same answers and the same two
 * choices always give the same recommendation.
 *
 * recommendation-v1 is an MVP hypothesis, not a validated model. The weights
 * and the threshold below were chosen to express the intent — "a job you did
 * not pick, where one kind of its work already interests you" — and have not
 * been tested against outcomes. The pre-survey is self-reported interest: the
 * recommendation is a lead to explore, never a measure of fit or ability.
 *
 * For each of the three candidates, from its Pre-LIKE index (0–100) and its
 * three area indices:
 *
 *   peak   = its strongest area
 *   spike  = peak − the job's overall index (an area that stands out from the
 *            job as a whole: the "you might not expect this" signal)
 *   score  = 0.5 × peak + 0.25 × overall + 0.25 × spike
 *
 * A candidate whose peak is below the neutral midpoint (50, an average answer
 * of 3) shows no meaningful interest signal. The recommendation is the
 * highest-scoring candidate with a signal; if none has one, the highest score
 * overall (`no-signal`). Ties go to the higher peak, then the higher overall
 * index, then the order the PS50 rubric lists the departments in.
 */
export const RECOMMENDATION_VERSION = 'recommendation-v1' as const;

const WEIGHTS = { peak: 0.5, overall: 0.25, spike: 0.25 } as const;
/** A peak area at or above this is a meaningful interest signal (3 of 5 = neutral). */
const SIGNAL_THRESHOLD = 50;

export type CandidateScore = {
  slug: RoleSlug;
  overall: number;
  peak: number;
  peakArea: string;
  spike: number;
  score: number;
  hasSignal: boolean;
};

export type DepartmentRecommendation = {
  version: typeof RECOMMENDATION_VERSION;
  recommended: RoleSlug;
  /** `signal`: picked among candidates with a real interest signal; `no-signal`: none had one. */
  basis: 'signal' | 'no-signal';
  chosen: RoleSlug[];
  /** Every candidate's figures, best first — kept for the final report. */
  candidates: CandidateScore[];
  weights: typeof WEIGHTS;
  signalThreshold: number;
};

export class RecommendationError extends Error {
  constructor(
    message: string,
    readonly code: 'pre_survey_incomplete' | 'invalid_choice',
  ) {
    super(message);
  }
}

const ROLE_ORDER = PS50_ROLE_RUBRICS.map((r) => r.role);
export const isRoleSlug = (slug: string): slug is RoleSlug =>
  (ROLE_ORDER as string[]).includes(slug);

/**
 * Recommends one department from the three the student did not choose.
 * Throws `RecommendationError` when the pre-survey is not complete or the
 * choice is not exactly two different departments.
 */
export function recommendDepartment(
  answers: Record<string, unknown>,
  chosen: string[],
): DepartmentRecommendation {
  const picks = Array.from(new Set(chosen));
  if (picks.length !== 2 || picks.length !== chosen.length || !picks.every(isRoleSlug)) {
    throw new RecommendationError('Choose exactly two different departments.', 'invalid_choice');
  }
  const survey = scorePreSurvey50(answers);
  if (!survey.complete) {
    throw new RecommendationError('Finish the pre-survey first.', 'pre_survey_incomplete');
  }

  const candidates: CandidateScore[] = ROLE_ORDER.filter((slug) => !picks.includes(slug)).map(
    (slug) => {
      const role = survey.roles[slug];
      const overall = role.index0to100 ?? 0;
      const top = [...role.dimensions].sort((a, b) => b.index0to100 - a.index0to100)[0];
      const peak = top?.index0to100 ?? overall;
      const spike = Math.max(0, peak - overall);
      const score = WEIGHTS.peak * peak + WEIGHTS.overall * overall + WEIGHTS.spike * spike;
      return {
        slug,
        overall,
        peak,
        peakArea: top?.code ?? '',
        spike,
        score: Math.round(score * 100) / 100,
        hasSignal: peak >= SIGNAL_THRESHOLD,
      };
    },
  );

  const ranked = [...candidates].sort(
    (a, b) =>
      b.score - a.score ||
      b.peak - a.peak ||
      b.overall - a.overall ||
      ROLE_ORDER.indexOf(a.slug) - ROLE_ORDER.indexOf(b.slug),
  );
  const withSignal = ranked.filter((c) => c.hasSignal);
  const pick = withSignal[0] ?? ranked[0];

  return {
    version: RECOMMENDATION_VERSION,
    recommended: pick.slug,
    basis: withSignal.length > 0 ? 'signal' : 'no-signal',
    chosen: picks as RoleSlug[],
    candidates: ranked,
    weights: WEIGHTS,
    signalThreshold: SIGNAL_THRESHOLD,
  };
}
