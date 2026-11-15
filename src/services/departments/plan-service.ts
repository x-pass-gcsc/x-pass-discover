import 'server-only';
import { getDepartment, listLocalizedDepartments } from '@/content/departments';
import { getRepository } from '@/db/repository';
import type { Locale } from '@/i18n/config';
import type { Translate } from '@/i18n/translate';
import { ScenarioRuleError } from '@/lib/errors';
import type { DepartmentSelection } from '@/types/runtime';
import {
  RecommendationError,
  isRoleSlug,
  recommendDepartment,
  type DepartmentRecommendation,
} from './recommendation';
import { checkOffer, makeOffer, type RecommendationOffer } from './recommendation-offer';

/**
 * The student's department plan: two or three departments, confirmed once.
 *
 *   two    the two departments the student chose, and nothing else;
 *   three  those two, and one recommended for them — a department they did
 *          not pick and would probably not have expected (see
 *          `recommendation-offer.ts`).
 *
 * Every rule is checked here, on the server. The client sends the two choices
 * and, for a plan of three, the signed offer it was shown; the third
 * department is always the one in that offer and can never be set directly.
 *
 * A selection saved before plans existed (a free pick of up to three) is left
 * exactly as it was and counts as not confirmed. Its bootcamps keep going —
 * a session that exists can always be resumed — but a new department starts
 * only from a confirmed plan.
 */
export type PlanSize = 2 | 3;

export type DepartmentPlan =
  | {
      confirmed: true;
      size: PlanSize;
      userChosenSlugs: string[];
      /** The recommended department; null in a plan of two. */
      aiRecommendedSlug: string | null;
      /** The departments of the plan, chosen first and the recommendation last. */
      departmentSlugs: string[];
      /** Why the third was recommended, as the student was shown it. */
      recommendationReason: string | null;
      confirmedAt: string;
    }
  | {
      confirmed: false;
      /** What a pre-plan selection held, if there is one; not a plan. */
      legacySlugs: string[];
    };

export function planFrom(selection: DepartmentSelection | null): DepartmentPlan {
  if (selection?.confirmedAt && selection.userChosenSlugs?.length === 2) {
    const ai = selection.aiRecommendedSlug ?? null;
    const offer = (selection.recommendation?.offer ?? null) as { reason?: unknown } | null;
    return {
      confirmed: true,
      size: ai ? 3 : 2,
      userChosenSlugs: selection.userChosenSlugs,
      aiRecommendedSlug: ai,
      departmentSlugs: ai ? [...selection.userChosenSlugs, ai] : [...selection.userChosenSlugs],
      recommendationReason: typeof offer?.reason === 'string' ? offer.reason : null,
      confirmedAt: selection.confirmedAt,
    };
  }
  return { confirmed: false, legacySlugs: selection?.departmentSlugs ?? [] };
}

export async function getDepartmentPlan(userId: string): Promise<DepartmentPlan> {
  return planFrom(await getRepository().getDepartmentSelection(userId));
}

function checkChoice(chosen: string[]) {
  const unique = Array.from(new Set(chosen));
  if (chosen.length !== 2 || unique.length !== 2) {
    throw new ScenarioRuleError('Choose exactly two different departments.', 'invalid_choice');
  }
  for (const slug of unique) {
    if (!isRoleSlug(slug) || !getDepartment(slug)) {
      throw new ScenarioRuleError(`Unknown department: ${slug}`, 'invalid_choice');
    }
  }
}

async function surveyAnswers(userId: string) {
  return (await getRepository().getPreSurvey(userId))?.answers ?? {};
}

function rulesFor(answers: Record<string, unknown>, chosen: string[]): DepartmentRecommendation {
  try {
    return recommendDepartment(answers, chosen);
  } catch (error) {
    if (error instanceof RecommendationError) throw new ScenarioRuleError(error.message, error.code);
    throw error;
  }
}

async function assertNotConfirmed(userId: string) {
  if ((await getDepartmentPlan(userId)).confirmed) {
    throw new ScenarioRuleError('Your departments are already confirmed.', 'already_confirmed');
  }
}

/**
 * The department recommended for these two choices, with the reason the
 * student reads and a signed token to confirm it with. The scores behind it
 * stay on the server until the final report.
 */
export async function previewRecommendation(
  userId: string,
  chosen: string[],
  locale: Locale,
  t: Translate,
): Promise<{ offer: RecommendationOffer; token: string }> {
  await assertNotConfirmed(userId);
  checkChoice(chosen);
  const answers = await surveyAnswers(userId);
  rulesFor(answers, chosen); // the same checks, as a ScenarioRuleError
  const localized = listLocalizedDepartments(locale);
  const nameOf = (slug: string) => localized.find((d) => d.slug === slug)?.name ?? slug;
  const { offer, token } = await makeOffer({ userId, answers, chosen, locale, t, nameOf });
  return { offer, token };
}

/**
 * Confirms the plan. With no `offerToken`, a plan of the two chosen
 * departments. With one, a plan of three: the token must be the offer this
 * student was shown for these same two choices.
 */
export async function confirmDepartmentPlan(
  userId: string,
  chosen: string[],
  offerToken: string | null,
): Promise<DepartmentPlan> {
  const repo = getRepository();
  const existing = await repo.getDepartmentSelection(userId);
  if (planFrom(existing).confirmed) {
    throw new ScenarioRuleError('Your departments are already confirmed.', 'already_confirmed');
  }
  checkChoice(chosen);
  const answers = await surveyAnswers(userId);
  // The pre-survey comes first for either size: the final report reads it back.
  const rules = rulesFor(answers, chosen);
  const previousSelection = existing?.departmentSlugs.length
    ? { previousSelection: existing.departmentSlugs }
    : {};

  let aiRecommendedSlug: string | null = null;
  let recommendation: Record<string, unknown> = { size: 2, rules, ...previousSelection };
  if (offerToken) {
    const check = checkOffer(offerToken, userId, chosen, rules.candidates.map((c) => c.slug));
    if (!check.ok) {
      throw new ScenarioRuleError(
        check.reason === 'expired'
          ? 'The recommendation has expired. Ask for it again before confirming.'
          : 'The recommendation does not match your choices. Ask for it again before confirming.',
        check.reason === 'expired' ? 'recommendation_expired' : 'recommendation_mismatch',
      );
    }
    aiRecommendedSlug = check.offer.recommended;
    recommendation = { size: 3, offer: check.offer, rules, ...previousSelection };
  }

  const saved = await repo.confirmDepartmentPlan(userId, {
    userChosenSlugs: rules.chosen,
    aiRecommendedSlug,
    recommendationVersion: rules.version,
    recommendation,
  });
  if (!saved) {
    throw new ScenarioRuleError('Your departments are already confirmed.', 'already_confirmed');
  }
  return planFrom(saved);
}

/** Refuses a new bootcamp in a department outside a confirmed plan. */
export async function assertCanStartDepartment(userId: string, departmentSlug: string) {
  const plan = await getDepartmentPlan(userId);
  if (!plan.confirmed) {
    throw new ScenarioRuleError(
      'Confirm your departments at the reception desk before starting a bootcamp.',
      'plan_not_confirmed',
    );
  }
  if (!plan.departmentSlugs.includes(departmentSlug)) {
    throw new ScenarioRuleError(
      'This department is not one of your confirmed departments.',
      'not_in_plan',
    );
  }
}
