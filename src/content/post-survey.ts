import { z } from 'zod';

/**
 * The post-survey, version post-survey-v1.0.
 *
 * Answered once, after all three departments of the student's 2+1 plan are
 * completed. Three parts, kept apart in storage and in meaning:
 *
 *   A. a look back at each department (the same questions, once per slug),
 *   B. the three compared, and where the student's career thinking stands,
 *   C. how X-PASS itself worked — service quality, never part of any fit.
 *
 * This module is shared by the form and the server, so both apply exactly the
 * same rules. `draftSchema` checks what is there (a draft may be unfinished);
 * `finalIssues` checks that everything required is there. Question keys are
 * stable: wording lives in the i18n dictionaries under `post.*`.
 */
export const POST_SURVEY_VERSION = 'post-survey-v1.0' as const;

export const SCALE_KEYS = ['a1', 'a2', 'a3', 'a4', 'a5'] as const;
export const A6_OPTIONS = ['research', 'conversation', 'decision', 'creation', 'revision', 'none', 'other'] as const;
export const A7_OPTIONS = ['context', 'data', 'decision', 'output', 'change', 'workload', 'usability', 'none', 'other'] as const;
export const B2_OPTIONS = ['process', 'learn', 'capable', 'purpose', 'confirmed', 'relative', 'other'] as const;
export const B3_OPTIONS = ['yes', 'unsure', 'nothing'] as const;
export const CAREER_DEPARTMENTS = ['marketing', 'sales', 'strategy', 'human-resources', 'product-management'] as const;
export const B4_OPTIONS = [...CAREER_DEPARTMENTS, 'other', 'none'] as const;
export const B7_OPTIONS = ['other-tasks', 'daily-life', 'practitioners', 'skills', 'other-jobs', 'self', 'decided', 'other'] as const;
export const C2_OPTIONS = ['enough', 'some-more', 'lacking', 'unused'] as const;
export const C5_OPTIONS = ['too-little', 'little', 'right', 'much', 'too-much'] as const;

/** Options that stand alone: chosen, they cannot be combined with another. */
const EXCLUSIVE = new Set(['none', 'decided']);

export const LIMITS = { shortText: 200, longText: 1000, maxPicks: 2 } as const;

const scale = z.number().int().min(1).max(7);
const shortText = z.string().trim().max(LIMITS.shortText);
const longText = z.string().trim().max(LIMITS.longText);

/** A multiple choice of `options`: no repeats, `none`-type alone, at most `max`. */
function picks<T extends readonly [string, ...string[]]>(options: T, max: number | null) {
  return z
    .array(z.enum(options))
    .superRefine((values, ctx) => {
      if (new Set(values).size !== values.length) ctx.addIssue({ code: 'custom', message: 'duplicate' });
      if (max !== null && values.length > max) ctx.addIssue({ code: 'custom', message: 'too_many' });
      if (values.length > 1 && values.some((v) => EXCLUSIVE.has(v))) {
        ctx.addIssue({ code: 'custom', message: 'exclusive' });
      }
    });
}

export const departmentAnswerSchema = z
  .object({
    a1: scale,
    a2: scale,
    a3: scale,
    a4: scale,
    a5: scale,
    a6: picks(A6_OPTIONS, LIMITS.maxPicks),
    a6Other: shortText,
    a7: picks(A7_OPTIONS, LIMITS.maxPicks),
    a7Other: shortText,
    a8: longText,
  })
  .partial()
  .strict();

export const comparisonAnswerSchema = z
  .object({
    b1Mode: z.enum(['ranked', 'undecided', 'none']),
    b1Order: z.array(z.string()).max(3),
    b2: picks(B2_OPTIONS, LIMITS.maxPicks),
    b2Other: shortText,
    b3: z.enum(B3_OPTIONS),
    b3Text: longText,
    b4: picks(B4_OPTIONS, null),
    b4Other: shortText,
    b5: scale,
    b6: scale,
    b7: picks(B7_OPTIONS, LIMITS.maxPicks),
    b7Other: shortText,
  })
  .partial()
  .strict();

export const experienceAnswerSchema = z
  .object({
    c1: scale,
    c2: z.enum(C2_OPTIONS),
    c2Detail: longText,
    c3: z.union([scale, z.literal('not_used')]),
    c4: scale,
    c5: z.enum(C5_OPTIONS),
    c6Best: longText,
    c6Change: longText,
    c7: longText,
  })
  .partial()
  .strict();

export type DepartmentAnswers = z.infer<typeof departmentAnswerSchema>;
export type ComparisonAnswers = z.infer<typeof comparisonAnswerSchema>;
export type ExperienceAnswers = z.infer<typeof experienceAnswerSchema>;

export type PostSurveyAnswers = {
  departmentAnswers: Record<string, DepartmentAnswers>;
  comparisonAnswers: ComparisonAnswers;
  experienceAnswers: ExperienceAnswers;
};

/**
 * The shape of a draft for one student's three departments: every value is
 * checked, nothing is required yet, and part A answers only for their slugs.
 */
export function draftSchema(planSlugs: string[]) {
  return z
    .object({
      departmentAnswers: z.record(z.string(), departmentAnswerSchema),
      comparisonAnswers: comparisonAnswerSchema,
      experienceAnswers: experienceAnswerSchema,
    })
    .strict()
    .superRefine((value, ctx) => {
      for (const slug of Object.keys(value.departmentAnswers)) {
        if (!planSlugs.includes(slug)) {
          ctx.addIssue({ code: 'custom', path: ['departmentAnswers', slug], message: 'not_in_plan' });
        }
      }
      // A draft may leave a place empty (''); a filled place is a plan
      // department, and no department is placed twice.
      const order = (value.comparisonAnswers.b1Order ?? []).filter(Boolean);
      if (order.some((slug) => !planSlugs.includes(slug)) || new Set(order).size !== order.length) {
        ctx.addIssue({ code: 'custom', path: ['comparisonAnswers', 'b1Order'], message: 'invalid_order' });
      }
    });
}

export type PostSurveyIssue = { path: string; code: 'required' | 'other_text' | 'invalid_order' };

const filled = (text: string | undefined) => !!text && text.trim().length > 0;

/**
 * What is still missing for a final submission, given a draft that already
 * passed `draftSchema`. Empty when the survey can be submitted.
 */
export function finalIssues(answers: PostSurveyAnswers, planSlugs: string[]): PostSurveyIssue[] {
  const issues: PostSurveyIssue[] = [];
  const need = (ok: boolean, path: string, code: PostSurveyIssue['code'] = 'required') => {
    if (!ok) issues.push({ path, code });
  };

  for (const slug of planSlugs) {
    const a = answers.departmentAnswers[slug] ?? {};
    for (const key of SCALE_KEYS) need(a[key] !== undefined, `${slug}.${key}`);
    need(!!a.a6?.length, `${slug}.a6`);
    need(!a.a6?.includes('other') || filled(a.a6Other), `${slug}.a6Other`, 'other_text');
    need(!!a.a7?.length, `${slug}.a7`);
    need(!a.a7?.includes('other') || filled(a.a7Other), `${slug}.a7Other`, 'other_text');
  }

  const b = answers.comparisonAnswers;
  need(!!b.b1Mode, 'b1');
  if (b.b1Mode === 'ranked') {
    const order = (b.b1Order ?? []).filter(Boolean);
    need(
      order.length === planSlugs.length && planSlugs.every((slug) => order.includes(slug)),
      'b1',
      'invalid_order',
    );
    need(!!b.b2?.length, 'b2');
    need(!b.b2?.includes('other') || filled(b.b2Other), 'b2Other', 'other_text');
  }
  need(!!b.b3, 'b3');
  need(!!b.b4?.length, 'b4');
  need(!b.b4?.includes('other') || filled(b.b4Other), 'b4Other', 'other_text');
  need(b.b5 !== undefined, 'b5');
  need(b.b6 !== undefined, 'b6');
  need(!!b.b7?.length, 'b7');
  need(!b.b7?.includes('other') || filled(b.b7Other), 'b7Other', 'other_text');

  const c = answers.experienceAnswers;
  need(c.c1 !== undefined, 'c1');
  need(!!c.c2, 'c2');
  need(c.c3 !== undefined, 'c3');
  need(c.c4 !== undefined, 'c4');
  need(!!c.c5, 'c5');
  return issues;
}

/**
 * Drops what a later answer made irrelevant, so it is not stored: "other"
 * text without "other", B2 without a ranking, B3 text without "yes".
 */
export function tidyAnswers(answers: PostSurveyAnswers): PostSurveyAnswers {
  const departmentAnswers = Object.fromEntries(
    Object.entries(answers.departmentAnswers).map(([slug, a]) => {
      const next = { ...a };
      if (!next.a6?.includes('other')) delete next.a6Other;
      if (!next.a7?.includes('other')) delete next.a7Other;
      return [slug, next];
    }),
  );
  const b = { ...answers.comparisonAnswers };
  if (b.b1Mode !== 'ranked') {
    delete b.b1Order;
    delete b.b2;
    delete b.b2Other;
  }
  if (!b.b2?.includes('other')) delete b.b2Other;
  if (b.b3 !== 'yes') delete b.b3Text;
  if (!b.b4?.includes('other')) delete b.b4Other;
  if (!b.b7?.includes('other')) delete b.b7Other;
  return { departmentAnswers, comparisonAnswers: b, experienceAnswers: { ...answers.experienceAnswers } };
}

/** Required answers given, out of all required — for the progress bar. */
export function progressOf(answers: PostSurveyAnswers, planSlugs: string[]): { done: number; total: number } {
  const empty: PostSurveyAnswers = { departmentAnswers: {}, comparisonAnswers: {}, experienceAnswers: {} };
  const total = finalIssues(empty, planSlugs).filter((i) => i.code === 'required').length +
    (answers.comparisonAnswers.b1Mode === 'ranked' ? 1 : 0);
  const missing = finalIssues(answers, planSlugs).filter((i) => i.code === 'required').length;
  return { done: Math.max(0, total - missing), total };
}
