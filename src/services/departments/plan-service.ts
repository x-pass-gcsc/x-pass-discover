import 'server-only';
import { getDepartment } from '@/content/departments';
import { getRepository } from '@/db/repository';
import { ScenarioRuleError } from '@/lib/errors';
import type { DepartmentSelection } from '@/types/runtime';
import {
  RecommendationError,
  isRoleSlug,
  recommendDepartment,
  type DepartmentRecommendation,
} from './recommendation';

/**
 * The student's department plan: two departments they choose, one recommended
 * for them, confirmed once. Every rule is checked here, on the server — the
 * client only ever sends the two choices and the recommendation it was shown,
 * and the server recomputes the recommendation itself.
 *
 * A selection saved before the 2+1 plan (a free pick of up to three) is left
 * exactly as it was and counts as not confirmed. Its bootcamps keep going —
 * a session that exists can always be resumed — but a new department starts
 * only from a confirmed plan.
 */
export type DepartmentPlan =
  | {
      confirmed: true;
      userChosenSlugs: string[];
      aiRecommendedSlug: string;
      /** The three, chosen first and the recommendation last. */
      departmentSlugs: string[];
      confirmedAt: string;
    }
  | {
      confirmed: false;
      /** What a pre-2+1 selection held, if there is one; not a plan. */
      legacySlugs: string[];
    };

export function planFrom(selection: DepartmentSelection | null): DepartmentPlan {
  if (
    selection?.confirmedAt &&
    selection.aiRecommendedSlug &&
    selection.userChosenSlugs?.length === 2
  ) {
    return {
      confirmed: true,
      userChosenSlugs: selection.userChosenSlugs,
      aiRecommendedSlug: selection.aiRecommendedSlug,
      departmentSlugs: [...selection.userChosenSlugs, selection.aiRecommendedSlug],
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

async function recommendFor(userId: string, chosen: string[]): Promise<DepartmentRecommendation> {
  checkChoice(chosen);
  const survey = await getRepository().getPreSurvey(userId);
  try {
    return recommendDepartment(survey?.answers ?? {}, chosen);
  } catch (error) {
    if (error instanceof RecommendationError) throw new ScenarioRuleError(error.message, error.code);
    throw error;
  }
}

/**
 * The department that would be recommended for these two choices. Returns the
 * slug only: the scores behind it stay on the server until the final report.
 */
export async function previewRecommendation(userId: string, chosen: string[]): Promise<string> {
  const plan = await getDepartmentPlan(userId);
  if (plan.confirmed) {
    throw new ScenarioRuleError('Your departments are already confirmed.', 'already_confirmed');
  }
  return (await recommendFor(userId, chosen)).recommended;
}

/**
 * Confirms the plan: the two choices, and the recommendation the student was
 * shown — which must be the one the server computes now, so nothing else can
 * be slipped in as the third department.
 */
export async function confirmDepartmentPlan(
  userId: string,
  chosen: string[],
  shownRecommendation: string,
): Promise<DepartmentPlan> {
  const repo = getRepository();
  const existing = await repo.getDepartmentSelection(userId);
  if (planFrom(existing).confirmed) {
    throw new ScenarioRuleError('Your departments are already confirmed.', 'already_confirmed');
  }
  const recommendation = await recommendFor(userId, chosen);
  if (recommendation.recommended !== shownRecommendation) {
    throw new ScenarioRuleError(
      'The recommendation has changed. Review it again before confirming.',
      'recommendation_mismatch',
    );
  }
  const saved = await repo.confirmDepartmentPlan(userId, {
    userChosenSlugs: recommendation.chosen,
    aiRecommendedSlug: recommendation.recommended,
    recommendationVersion: recommendation.version,
    recommendation: {
      ...recommendation,
      // A pre-2+1 selection is replaced by the plan; what it held is kept here.
      ...(existing?.departmentSlugs.length ? { previousSelection: existing.departmentSlugs } : {}),
    },
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
      'Confirm your three departments at the reception desk before starting a bootcamp.',
      'plan_not_confirmed',
    );
  }
  if (!plan.departmentSlugs.includes(departmentSlug)) {
    throw new ScenarioRuleError(
      'This department is not one of your three confirmed departments.',
      'not_in_plan',
    );
  }
}
