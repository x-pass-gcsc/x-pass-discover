/**
 * X-PASS Pre-survey 50: provisional, deterministic scoring rubric v1.0.
 * Source: Google Drive / 11.1 / Pre-survey 50.docx (2026-11-01).
 * Compatible with existing GitHub answer keys PS50_01 ... PS50_50.
 *
 * This is a self-reported work-activity preference / tendency index, NOT a
 * measure of job performance, hiring success, or validated person-job fit.
 *
 * Keep LIKE separate from behavior-based SKILL FIT.
 */

export const PS50_RUBRIC_VERSION = 'ps50-like-v1.0.0' as const;

export type RoleSlug =
  | 'marketing'
  | 'strategy'
  | 'sales'
  | 'human-resources'
  | 'product-management';

export type RoleDimension = {
  code: string;
  labelKo: string;
  labelEn: string;
  /** 1-based question numbers. Dimension memberships never overlap. */
  questions: readonly number[];
};

export type RoleRubric = {
  role: RoleSlug;
  labelKo: string;
  questions: readonly number[];
  dimensions: readonly RoleDimension[];
};

/**
 * Equal weights are intentional for v1: the source enumerates 10 competencies
 * per role but does not substantiate differential weights. The three proposed
 * subdimensions per role are an X-PASS design taxonomy, not source-validated
 * independent psychological factors.
 */
export const PS50_ROLE_RUBRICS: readonly RoleRubric[] = [
  {
    role: 'marketing', labelKo: '마케팅', questions: [1,2,3,4,5,6,7,8,9,10],
    dimensions: [
      { code: 'audience_insight', labelKo: '고객·수용자 이해', labelEn: 'Audience insight', questions: [1,3,7] },
      { code: 'creative_communication', labelKo: '창의적 표현·소통', labelEn: 'Creative communication', questions: [2,5,6,10] },
      { code: 'analysis_experiment', labelKo: '분석·실험·개선', labelEn: 'Analysis and experimentation', questions: [4,8,9] },
    ],
  },
  {
    role: 'strategy', labelKo: '전략기획', questions: [11,12,13,14,15,16,17,18,19,20],
    dimensions: [
      { code: 'problem_diagnosis', labelKo: '문제 분석·근거 검토', labelEn: 'Problem diagnosis', questions: [12,13,14] },
      { code: 'systems_foresight', labelKo: '시스템·미래 시나리오', labelEn: 'Systems and foresight', questions: [11,17,20] },
      { code: 'tradeoff_prioritization', labelKo: '선택·우선순위·자원배분', labelEn: 'Trade-offs and prioritization', questions: [15,16,18,19] },
    ],
  },
  {
    role: 'sales', labelKo: '영업', questions: [21,22,23,24,25,26,27,28,29,30],
    dimensions: [
      { code: 'relationship_needs', labelKo: '관계 형성·니즈 파악', labelEn: 'Relationship and needs', questions: [22,23,24,29] },
      { code: 'persuasion_negotiation', labelKo: '설득·이견 조율', labelEn: 'Persuasion and negotiation', questions: [21,25,26,30] },
      { code: 'initiative_resilience', labelKo: '주도성·회복탄력성', labelEn: 'Initiative and resilience', questions: [27,28] },
    ],
  },
  {
    role: 'human-resources', labelKo: '인사', questions: [31,32,33,34,35,36,37,38,39,40],
    dimensions: [
      { code: 'people_understanding', labelKo: '사람·상황 이해', labelEn: 'People understanding', questions: [31,32,34,39] },
      { code: 'fairness_conflict', labelKo: '공정성·갈등 해결·윤리', labelEn: 'Fairness and conflict', questions: [33,35,36] },
      { code: 'development_coordination', labelKo: '성장 지원·협업 조율', labelEn: 'Development and coordination', questions: [37,38,40] },
    ],
  },
  {
    role: 'product-management', labelKo: '프로덕트 매니지먼트', questions: [41,42,43,44,45,46,47,48,49,50],
    dimensions: [
      { code: 'problem_discovery', labelKo: '사용자·문제 발견', labelEn: 'Customer and problem discovery', questions: [41,42,43] },
      { code: 'product_prioritization', labelKo: '가치 판단·우선순위', labelEn: 'Value and prioritization', questions: [44,45,46] },
      { code: 'execution_collaboration', labelKo: '실행·변경 대응·협업', labelEn: 'Execution and collaboration', questions: [47,48,49,50] },
    ],
  },
] as const;

export type DimensionScore = {
  code: string;
  labelKo: string;
  labelEn: string;
  questionNumbers: readonly number[];
  /** Percent-point index. NOT percent chance of performance. */
  index0to100: number;
};

export type RoleScore = {
  role: RoleSlug;
  labelKo: string;
  answered: number;
  required: 10;
  status: 'complete' | 'incomplete';
  /** Null instead of fabricating a result from partial answers. */
  index0to100: number | null;
  /** Original mean on the 1-5 Likert scale, for troubleshooting only. */
  meanLikert: number | null;
  dimensions: DimensionScore[];
};

export type SurveyScore = {
  rubricVersion: typeof PS50_RUBRIC_VERSION;
  completedQuestions: number;
  requiredQuestions: 50;
  complete: boolean;
  roles: Record<RoleSlug, RoleScore>;
  /** Exploratory candidates incl. ties at the third rank; no certified fit ranking. */
  explorationCandidates: RoleSlug[];
  /** True if the top two have <=5 percentage point difference (design heuristic). */
  similarTopScores: boolean | null;
  note: string;
};

const keyFor = (n: number): string => `PS50_${String(n).padStart(2, '0')}`;
const isValidAnswer = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;

/** Exactly 1 => 0, 3 => 50, 5 => 100. */
function as0to100(values: number[]): number {
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  return Math.round((mean - 1) * 25);
}

function scoreRole(answers: Record<string, unknown>, spec: RoleRubric): RoleScore {
  const raw = spec.questions.map((n) => answers[keyFor(n)]);
  const answered = raw.filter(isValidAnswer).length;
  if (answered !== 10) {
    return {
      role: spec.role, labelKo: spec.labelKo, answered, required: 10,
      status: 'incomplete', index0to100: null, meanLikert: null, dimensions: [],
    };
  }
  const values = raw as number[];
  const meanLikert = Number((values.reduce((sum, n) => sum + n, 0) / 10).toFixed(2));
  return {
    role: spec.role, labelKo: spec.labelKo, answered: 10, required: 10,
    status: 'complete', index0to100: as0to100(values), meanLikert,
    dimensions: spec.dimensions.map((dim) => ({
      code: dim.code, labelKo: dim.labelKo, labelEn: dim.labelEn,
      questionNumbers: dim.questions,
      index0to100: as0to100(dim.questions.map((n) => answers[keyFor(n)] as number)),
    })),
  };
}

export function scorePreSurvey50(answers: Record<string, unknown>): SurveyScore {
  const roleResults = PS50_ROLE_RUBRICS.map((spec) => scoreRole(answers, spec));
  const roles = Object.fromEntries(roleResults.map((row) => [row.role, row])) as Record<RoleSlug, RoleScore>;
  const completedQuestions = roleResults.reduce((sum, r) => sum + r.answered, 0);
  const complete = completedQuestions === 50;
  // A partial submission must not expose a final role index, even if all ten
  // answers within another role are present. This avoids accidental display
  // of misleading per-role scores from an unfinished 50-item inventory.
  if (!complete) {
    for (const row of roleResults) {
      row.status = 'incomplete';
      row.index0to100 = null;
      row.meanLikert = null;
      row.dimensions = [];
    }
  }
  const sorted = complete
    ? [...roleResults].sort((a, b) =>
        (b.index0to100 ?? 0) - (a.index0to100 ?? 0) || a.role.localeCompare(b.role),
      )
    : [];
  // If positions 3 and 4 are tied, include both (possibly all five). We do
  // not invent meaningful distinctions by ordering equal scores by name.
  const thirdScore = sorted.length ? sorted[Math.min(2, sorted.length - 1)].index0to100 : null;
  const explorationCandidates = sorted
    .filter((row) => thirdScore !== null && row.index0to100 !== null && row.index0to100 >= thirdScore)
    .map((row) => row.role);
  return {
    rubricVersion: PS50_RUBRIC_VERSION,
    completedQuestions,
    requiredQuestions: 50,
    complete,
    roles,
    explorationCandidates,
    similarTopScores: complete
      ? (sorted[0].index0to100! - sorted[1].index0to100!) <= 5
      : null,
    note: 'Exploratory self-report preference/tendency index only; not a validated job-fit or skill score.',
  };
}

/** Drop-in scoring helper for the current `likeForDepartment()` report interface. */
export function scoreDepartmentLikeV1(
  answers: Record<string, unknown> | undefined,
  department: string,
): number | null {
  if (!answers || !PS50_ROLE_RUBRICS.some((row) => row.role === department)) return null;
  const result = scorePreSurvey50(answers);
  // Never display a final PS50 index until every one of its 50 items is valid.
  if (!result.complete) return null;
  return result.roles[department as RoleSlug].index0to100;
}
