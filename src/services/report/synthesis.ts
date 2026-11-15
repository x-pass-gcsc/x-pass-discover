import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { ComparisonAnswers, DepartmentAnswers } from '@/content/post-survey';
import { scorePreSurvey50, type RoleSlug } from '@/content/pre-survey-rubric-v1';
import { getRepository } from '@/db/repository';
import type { Locale } from '@/i18n/config';
import type { MessageKey } from '@/i18n/messages/en';
import type { Translate } from '@/i18n/translate';
import { env } from '@/lib/env';
import { askClaudeJson, claudeAvailable } from '@/services/ai/claude';
import type { DepartmentPlan } from '@/services/departments/plan-service';
import type { CareerPostSurvey } from '@/types/runtime';
import type { DepartmentBehavior } from './behavior-analysis';

/**
 * The final report's overall summary: one reading of before, during and
 * after, side by side.
 *
 *   before  what the student expected — the plan they made (and the
 *           recommendation they took), and the Pre-LIKE order of its
 *           departments;
 *   during  how they worked in each bootcamp (`behavior-analysis.ts`);
 *   after   what they said once it was done (the post-survey).
 *
 * The three are compared by ORDER and in words, never merged into a number:
 * the pre-survey and the post-survey use different questions and scales, and
 * behavior is evidence, not points.
 *
 * Claude writes the summary when `ANTHROPIC_API_KEY` is set; the rules below
 * write it otherwise, or whenever Claude's answer cannot be used. A Claude
 * summary is stored (`career_reports`) per language, keyed by a hash of its
 * inputs, so it is written once — the inputs no longer change after the
 * post-survey is submitted.
 */
export const SYNTHESIS_VERSION = 'synthesis-v1' as const;

export type Synthesis = {
  headline: string;
  paragraphs: string[];
  nextSteps: string[];
  source: 'claude' | 'rules';
};

export type SynthesisInput = {
  plan: Extract<DepartmentPlan, { confirmed: true }>;
  preSurveyAnswers: Record<string, unknown>;
  behavior: DepartmentBehavior[];
  postSurvey: CareerPostSurvey;
};

type Facts = {
  departments: Array<{
    slug: string;
    name: string;
    how: 'chosen' | 'recommended';
    preLike: number | null;
    preTopArea: string | null;
    postInterest: number | null;
    postAgain: number | null;
    postFeltFit: number | null;
    postUnderstanding: number | null;
    postNote: string | null;
    behavior: DepartmentBehavior | null;
  }>;
  /** Plan departments by Pre-LIKE, highest first. */
  preOrder: string[];
  /** Plan departments as ranked after the work, if the student ranked them. */
  postOrder: string[] | null;
  postRanking: ComparisonAnswers['b1Mode'] | null;
  recommendationReason: string | null;
  wantToExplore: string[];
  careerConfidence: number | null;
  selfDiscovery: string | null;
};

function factsOf(input: SynthesisInput, nameOf: (slug: string) => string, t: Translate): Facts {
  const survey = scorePreSurvey50(input.preSurveyAnswers);
  const perDepartment = input.postSurvey.departmentAnswers as Record<string, DepartmentAnswers>;
  const comparison = input.postSurvey.comparisonAnswers as ComparisonAnswers;
  const departments = input.plan.departmentSlugs.map((slug) => {
    const role = survey.roles[slug as RoleSlug];
    const top = role ? [...role.dimensions].sort((a, b) => b.index0to100 - a.index0to100)[0] : null;
    const post = perDepartment[slug] ?? {};
    return {
      slug,
      name: nameOf(slug),
      how: (slug === input.plan.aiRecommendedSlug ? 'recommended' : 'chosen') as 'chosen' | 'recommended',
      preLike: role?.index0to100 ?? null,
      preTopArea: top ? t(`report.dim.${top.code}` as MessageKey) : null,
      postInterest: post.a1 ?? null,
      postAgain: post.a2 ?? null,
      postFeltFit: post.a3 ?? null,
      postUnderstanding: post.a4 ?? null,
      postNote: post.a8?.trim() || null,
      behavior: input.behavior.find((b) => b.departmentSlug === slug) ?? null,
    };
  });
  const preOrder = [...departments]
    .sort((a, b) => (b.preLike ?? -1) - (a.preLike ?? -1))
    .map((d) => d.slug);
  const ranked = (comparison.b1Order ?? []).filter(Boolean);
  return {
    departments,
    preOrder,
    postOrder: comparison.b1Mode === 'ranked' && ranked.length ? ranked : null,
    postRanking: comparison.b1Mode ?? null,
    recommendationReason: input.plan.recommendationReason,
    wantToExplore: (comparison.b4 ?? []).filter((slug) => slug !== 'none' && slug !== 'other'),
    careerConfidence: comparison.b5 ?? null,
    selfDiscovery: comparison.b3 === 'yes' ? comparison.b3Text?.trim() || null : null,
  };
}

// ---------------------------------------------------------------- the rules

/** The summary from the rules: always available, the same for the same inputs. */
export function rulesSynthesis(facts: Facts, nameOf: (slug: string) => string, t: Translate): Synthesis {
  const paragraphs: string[] = [];
  const preTop = facts.preOrder[0];
  const postTop = facts.postOrder?.[0] ?? null;

  const headline = postTop
    ? t('report.synth.headline.ranked', { department: nameOf(postTop) })
    : facts.postRanking === 'none'
      ? t('report.synth.headline.none')
      : t('report.synth.headline.undecided');

  // Before → after: the order changed, or held.
  if (preTop && postTop) {
    paragraphs.push(
      preTop === postTop
        ? t('report.synth.order.same', { department: nameOf(preTop) })
        : t('report.synth.order.changed', { before: nameOf(preTop), after: nameOf(postTop) }),
    );
  } else if (preTop) {
    paragraphs.push(t('report.synth.order.noRanking', { department: nameOf(preTop) }));
  }

  // The recommendation: how it went, against the student's own choices.
  const pick = facts.departments.find((d) => d.how === 'recommended');
  if (pick) {
    const own = facts.departments.filter((d) => d.how === 'chosen' && d.postInterest !== null);
    const bestOwn = Math.max(...own.map((d) => d.postInterest!));
    paragraphs.push(
      pick.postInterest !== null && own.length && pick.postInterest >= bestOwn
        ? t('report.synth.pick.surprise', { department: pick.name })
        : t('report.synth.pick.confirmed', { department: pick.name }),
    );
  } else {
    paragraphs.push(t('report.synth.pick.none'));
  }

  // During: where they dug deepest, and whether it matches what they liked.
  const withBehavior = facts.departments.filter((d) => d.behavior);
  if (withBehavior.length) {
    const deepest = [...withBehavior].sort(
      (a, b) =>
        b.behavior!.questions + b.behavior!.resourcesOpened - (a.behavior!.questions + a.behavior!.resourcesOpened),
    )[0];
    const liked = [...facts.departments]
      .filter((d) => d.postInterest !== null)
      .sort((a, b) => b.postInterest! - a.postInterest!)[0];
    paragraphs.push(
      liked && liked.slug === deepest.slug
        ? t('report.synth.behavior.match', { department: deepest.name })
        : t('report.synth.behavior.differ', {
            deepest: deepest.name,
            liked: liked?.name ?? deepest.name,
          }),
    );
    const revised = withBehavior.filter((d) => d.behavior!.observations.includes('revised_after_change'));
    if (revised.length) {
      paragraphs.push(t('report.synth.behavior.revised', { departments: revised.map((d) => d.name).join(t('report.synth.listSeparator')) }));
    }
  }

  const nextSteps: string[] = [];
  for (const slug of facts.wantToExplore.slice(0, 2)) {
    nextSteps.push(t('report.synth.next.explore', { department: nameOf(slug) }));
  }
  if (facts.careerConfidence !== null && facts.careerConfidence <= 3) {
    nextSteps.push(t('report.synth.next.lowConfidence'));
  }
  nextSteps.push(t('report.synth.next.compare'));

  return { headline, paragraphs, nextSteps: nextSteps.slice(0, 3), source: 'rules' };
}

// ---------------------------------------------------------------- Claude

const LANGUAGE: Record<Locale, string> = { en: 'English', ja: 'Japanese', ko: 'Korean' };

const synthesisAnswer = z.object({
  headline: z.string().trim().min(4).max(200),
  paragraphs: z.array(z.string().trim().min(10).max(900)).min(2).max(5),
  nextSteps: z.array(z.string().trim().min(4).max(300)).min(1).max(4),
});

async function claudeSynthesis(facts: Facts, locale: Locale): Promise<Synthesis | null> {
  const system = [
    'You write the closing summary of a career-exploration report for a student who used X-PASS',
    "Discover: they spent a few hours in each of two or three departments of a fictional food &",
    "beverage company, doing that department's real work with AI colleagues.",
    '',
    'You get three kinds of facts. BEFORE: the departments they chose (and one an AI recommended to',
    'them as unexpected, if they took it), and their pre-survey interest index (Pre-LIKE, 0-100,',
    'self-reported). DURING: what they did in each bootcamp — documents opened, questions asked,',
    'follow-ups, facts uncovered, decisions revised after the situation changed. These are',
    'observations, not points. AFTER: their post-survey (1-7 scales: interest, wanting to do it',
    'again, felt fit, understanding), the order they now want to explore the jobs in, and their',
    'confidence in a career choice.',
    '',
    'Rules:',
    '- Write in ' + LANGUAGE[locale] + ', to the student, in the second person. Warm, plain and specific.',
    '- Connect before, during and after: what they expected, what they did, how they feel now. Point',
    '  out where these agree and where they differ, citing the concrete facts.',
    '- Never merge the measures into one score, never compute a before/after difference between the',
    '  pre-survey and the post-survey (they use different questions and scales), and never judge',
    '  ability or say what job they are suited to. Liking a job and being good at it are separate',
    '  questions; skill fit is not assessed in this report.',
    '- If they took the AI recommendation, say how that unexpected department went for them.',
    '- Do not invent facts that are not in the input.',
    '- headline: one sentence. paragraphs: 3 or 4, each 2-4 sentences. nextSteps: 2 or 3 concrete,',
    '  small actions for the coming weeks.',
  ].join('\n');

  const answer = await askClaudeJson({
    purpose: 'report-synthesis',
    system,
    prompt: JSON.stringify(facts, null, 2),
    jsonSchema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        paragraphs: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
      },
      required: ['headline', 'paragraphs', 'nextSteps'],
      additionalProperties: false,
    },
    parse: synthesisAnswer,
    maxTokens: 8000,
    effort: 'medium',
  });
  return answer ? { ...answer, source: 'claude' } : null;
}

// ---------------------------------------------------------------- entry points

const hashOf = (facts: Facts) =>
  createHash('sha256').update(SYNTHESIS_VERSION).update(JSON.stringify(facts)).digest('hex').slice(0, 32);

type StoredEntry = Synthesis & { inputHash: string; model?: string };
type StoredSynthesis = {
  kind: 'synthesis';
  version: typeof SYNTHESIS_VERSION;
  /** One per language; each is valid only for the inputs it was written from. */
  byLocale: Partial<Record<Locale, StoredEntry>>;
};

function storedFrom(payload: Record<string, unknown> | undefined): StoredSynthesis | null {
  const stored = payload as StoredSynthesis | undefined;
  return stored?.kind === 'synthesis' && stored.version === SYNTHESIS_VERSION ? stored : null;
}

function cachedFor(stored: StoredSynthesis | null, locale: Locale, inputHash: string): Synthesis | null {
  const entry = stored?.byLocale[locale];
  if (!entry || entry.inputHash !== inputHash) return null;
  return { headline: entry.headline, paragraphs: entry.paragraphs, nextSteps: entry.nextSteps, source: entry.source };
}

/**
 * What the report page shows first: a stored Claude summary if there is
 * one, else the rules' summary — and whether it is worth asking Claude
 * (from the browser, so the page does not wait on it).
 */
export async function initialSynthesis(
  userId: string,
  input: SynthesisInput,
  locale: Locale,
  t: Translate,
  nameOf: (slug: string) => string,
): Promise<{ synthesis: Synthesis; canImprove: boolean }> {
  const facts = factsOf(input, nameOf, t);
  const stored = storedFrom((await getRepository().getCareerReport(userId))?.payload);
  const cached = cachedFor(stored, locale, hashOf(facts));
  if (cached) return { synthesis: cached, canImprove: false };
  return { synthesis: rulesSynthesis(facts, nameOf, t), canImprove: claudeAvailable() };
}

/**
 * The best summary there is: stored, or written by Claude now and stored, or
 * — when Claude is not available or fails — the rules' summary (not stored,
 * so a later visit can try Claude again).
 */
export async function generateSynthesis(
  userId: string,
  input: SynthesisInput,
  locale: Locale,
  t: Translate,
  nameOf: (slug: string) => string,
): Promise<Synthesis> {
  const facts = factsOf(input, nameOf, t);
  const inputHash = hashOf(facts);
  const repo = getRepository();
  const stored = storedFrom((await repo.getCareerReport(userId))?.payload);
  const cached = cachedFor(stored, locale, inputHash);
  if (cached) return cached;

  const written = await claudeSynthesis(facts, locale);
  if (!written) return rulesSynthesis(facts, nameOf, t);
  const next: StoredSynthesis = {
    kind: 'synthesis',
    version: SYNTHESIS_VERSION,
    byLocale: { ...(stored?.byLocale ?? {}), [locale]: { ...written, inputHash, model: env.claudeModel } },
  };
  await repo.saveCareerReport(userId, next as unknown as Record<string, unknown>);
  return written;
}

/** The rules' summary straight from the inputs (for checks and tests). */
export function rulesSynthesisFor(
  input: SynthesisInput,
  t: Translate,
  nameOf: (slug: string) => string,
): Synthesis {
  return rulesSynthesis(factsOf(input, nameOf, t), nameOf, t);
}
