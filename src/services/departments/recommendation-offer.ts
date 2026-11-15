import 'server-only';
import { z } from 'zod';
import { getDepartment } from '@/content/departments';
import { scorePreSurvey50, type RoleSlug } from '@/content/pre-survey-rubric-v1';
import type { Locale } from '@/i18n/config';
import type { MessageKey } from '@/i18n/messages/en';
import type { Translate } from '@/i18n/translate';
import { readToken, signToken } from '@/lib/signed-token';
import { askClaudeJson } from '@/services/ai/claude';
import { env } from '@/lib/env';
import { recommendDepartment, type DepartmentRecommendation } from './recommendation';

/**
 * The third department, offered to the student with a reason.
 *
 * Two layers:
 *
 *   1. `recommendDepartment` (recommendation-v1) — deterministic rules over
 *      the PS50 pre-survey scores. Always computed; it is the fallback and it
 *      is kept with the plan for the final report.
 *   2. Claude — when `ANTHROPIC_API_KEY` is set, Claude reads the same scores
 *      and the two choices and picks, from the three departments the student
 *      did not choose, the one they would least expect to suit them yet where
 *      their own answers show a hook. It writes the reason the student reads.
 *
 * Claude's pick is accepted only if it is one of the three candidates; any
 * failure (no key, error, an answer outside the candidates) falls back to
 * the rules. Because a Claude answer is not deterministic, the offer the
 * student saw is handed to them as a signed token, and confirming the plan
 * takes that token back — so the third department is exactly what they were
 * shown, and can never be set by the client.
 *
 * The reason never quotes a score: the pre-survey result itself stays
 * withheld until the final report.
 */
export const OFFER_TOKEN_PURPOSE = 'department-recommendation-offer';
/** An offer older than this must be asked for again. */
const OFFER_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export type RecommendationOffer = {
  userId: string;
  chosen: RoleSlug[];
  recommended: RoleSlug;
  /** Shown to the student, in their language, with no numbers in it. */
  reason: string;
  source: 'claude' | 'rules';
  /** The Claude model, when Claude made the pick. */
  model?: string;
  locale: Locale;
  issuedAt: string;
};

const LANGUAGE: Record<Locale, string> = { en: 'English', ja: 'Japanese', ko: 'Korean' };

/** The reason the rules give, for whichever candidate was picked. */
function rulesReason(
  rules: DepartmentRecommendation,
  slug: RoleSlug,
  t: Translate,
  nameOf: (slug: string) => string,
): string {
  const candidate = rules.candidates.find((c) => c.slug === slug);
  const vars = {
    department: nameOf(slug),
    first: nameOf(rules.chosen[0]),
    second: nameOf(rules.chosen[1]),
    area: candidate?.peakArea ? t(`report.dim.${candidate.peakArea}` as MessageKey) : '',
  };
  return candidate?.hasSignal && candidate.peakArea
    ? t('plan.reason.signal', vars)
    : t('plan.reason.noSignal', vars);
}

const claudeAnswer = z.object({
  recommended: z.string(),
  reason: z.string().trim().min(10).max(600),
});

async function askClaude(
  answers: Record<string, unknown>,
  rules: DepartmentRecommendation,
  locale: Locale,
): Promise<{ recommended: RoleSlug; reason: string } | null> {
  const survey = scorePreSurvey50(answers);
  const describe = (slug: RoleSlug) => {
    const department = getDepartment(slug);
    const role = survey.roles[slug];
    return {
      slug,
      name: department?.name ?? slug,
      whatTheWorkIs: department ? `${department.tagline}. ${department.description}` : '',
      preSurveyInterestOverall: role.index0to100,
      preSurveyInterestByArea: Object.fromEntries(
        role.dimensions.map((d) => [d.labelEn, d.index0to100]),
      ),
    };
  };
  const candidates = rules.candidates.map((c) => c.slug);

  const system = [
    'You work inside X-PASS Discover, a job-experience app. A student spends a few hours in each of',
    "several departments of a fictional food & beverage company, doing that department's real work.",
    'The student has chosen two departments themselves. Your job is to pick the third one for them,',
    'from the departments they did NOT choose: the one they would least expect to be for them, yet',
    'where their own pre-survey answers show a genuine hook — an area of that job they are already',
    'drawn to. Prefer a real contrast with their two choices over the department most similar to them.',
    '',
    'The pre-survey numbers are self-reported interest on a 0-100 scale (50 = neutral). They say',
    'nothing about ability. Never present the pick as a verdict on fit or talent; it is an invitation',
    'to try something unexpected.',
    '',
    'Write `reason` to the student, in the second person, in ' + LANGUAGE[locale] + ':',
    'two or three short sentences, friendly and concrete. Say what in that job connects to something',
    'they showed interest in, and how it differs from the two they picked. Do not quote any number or',
    'score, do not mention the survey scale, and do not name departments outside the candidate list.',
  ].join('\n');

  const prompt = JSON.stringify(
    {
      chosenByStudent: rules.chosen.map(describe),
      candidates: candidates.map(describe),
      // A hint only: the deterministic rule's ranking of the candidates.
      ruleBasedRanking: candidates,
    },
    null,
    2,
  );

  const answer = await askClaudeJson({
    purpose: 'department-recommendation',
    system,
    prompt,
    jsonSchema: {
      type: 'object',
      properties: {
        recommended: { type: 'string', enum: candidates },
        reason: { type: 'string' },
      },
      required: ['recommended', 'reason'],
      additionalProperties: false,
    },
    parse: claudeAnswer,
    maxTokens: 2000,
  });
  if (!answer || !candidates.includes(answer.recommended as RoleSlug)) return null;
  return { recommended: answer.recommended as RoleSlug, reason: answer.reason };
}

/**
 * Makes the offer for two choices. Throws `RecommendationError` (from the
 * rules) when the pre-survey is not complete or the choice is not two
 * different departments.
 */
export async function makeOffer(input: {
  userId: string;
  answers: Record<string, unknown>;
  chosen: string[];
  locale: Locale;
  t: Translate;
  nameOf: (slug: string) => string;
}): Promise<{ offer: RecommendationOffer; token: string; rules: DepartmentRecommendation }> {
  const rules = recommendDepartment(input.answers, input.chosen);
  const fromClaude = await askClaude(input.answers, rules, input.locale);
  const recommended = fromClaude?.recommended ?? rules.recommended;
  // A reason that slipped a number in is replaced with the rules' wording.
  const reason =
    fromClaude && !/[0-9０-９]/.test(fromClaude.reason)
      ? fromClaude.reason
      : rulesReason(rules, recommended, input.t, input.nameOf);
  const offer: RecommendationOffer = {
    userId: input.userId,
    chosen: rules.chosen,
    recommended,
    reason,
    source: fromClaude ? 'claude' : 'rules',
    ...(fromClaude ? { model: env.claudeModel } : {}),
    locale: input.locale,
    issuedAt: new Date().toISOString(),
  };
  return { offer, token: signToken(OFFER_TOKEN_PURPOSE, offer), rules };
}

const offerSchema = z.object({
  userId: z.string(),
  chosen: z.array(z.string()).length(2),
  recommended: z.string(),
  reason: z.string(),
  source: z.enum(['claude', 'rules']),
  model: z.string().optional(),
  locale: z.enum(['en', 'ja', 'ko']),
  issuedAt: z.string(),
});

export type OfferCheck =
  | { ok: true; offer: RecommendationOffer }
  | { ok: false; reason: 'invalid' | 'expired' | 'mismatch' };

/**
 * Takes an offer token back: it must be ours, for this student, for these
 * two choices, recent, and recommend one of the departments they did not
 * choose.
 */
export function checkOffer(token: string, userId: string, chosen: string[], candidates: string[]): OfferCheck {
  const parsed = offerSchema.safeParse(readToken(OFFER_TOKEN_PURPOSE, token));
  if (!parsed.success) return { ok: false, reason: 'invalid' };
  const offer = parsed.data as RecommendationOffer;
  const age = Date.now() - Date.parse(offer.issuedAt);
  if (!(age >= -60_000 && age <= OFFER_MAX_AGE_MS)) return { ok: false, reason: 'expired' };
  const sameChoice =
    offer.chosen.length === chosen.length && chosen.every((slug) => offer.chosen.includes(slug as RoleSlug));
  if (offer.userId !== userId || !sameChoice || !candidates.includes(offer.recommended)) {
    return { ok: false, reason: 'mismatch' };
  }
  return { ok: true, offer };
}
