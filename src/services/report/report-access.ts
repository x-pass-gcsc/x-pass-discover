import 'server-only';
import { scorePreSurvey50 } from '@/content/pre-survey-rubric-v1';
import { getRepository } from '@/db/repository';
import { planFrom } from '@/services/departments/plan-service';

/** How many departments a plan may hold: two chosen, plus one recommended or not. */
export const PLAN_SIZES = [2, 3] as const;
/** What the report page assumes before a plan is confirmed. */
export const DEFAULT_PLAN_SIZE = 3;

/**
 * Whether a student may see their final report — and with it, anything that
 * reads their pre-survey back to them (scores, areas, recommended jobs).
 *
 * The pre-survey is saved and scored when it is submitted, but its result is
 * withheld until the end, so it cannot steer which departments the student
 * tries or how they behave in them. The report opens only when all three hold:
 *
 *   1. the 50-question pre-survey is complete,
 *   2. the department plan is confirmed (two chosen, plus one recommended
 *      or not), and each of its departments has a completed bootcamp,
 *   3. the post-survey has been submitted.
 *
 * Every check reads real records only; nothing is assumed done.
 */
export type ReportAccess = {
  unlocked: boolean;
  preSurveyComplete: boolean;
  /** Whether the plan is confirmed. */
  planConfirmed: boolean;
  /** The plan's two or three departments; empty until it is confirmed. */
  confirmedDepartments: string[];
  /** How many departments must be completed: the plan's size once confirmed. */
  requiredDepartments: number;
  /** Those of them with a completed bootcamp. */
  completedDepartments: string[];
  postSurveySubmitted: boolean;
};

export async function getReportAccess(userId: string): Promise<ReportAccess> {
  const repo = getRepository();
  const [preSurvey, selection, sessions] = await Promise.all([
    repo.getPreSurvey(userId),
    repo.getDepartmentSelection(userId),
    repo.listSessionsForUser(userId),
  ]);

  const preSurveyComplete = !!preSurvey && scorePreSurvey50(preSurvey.answers).complete;
  const plan = planFrom(selection);
  const confirmedDepartments = plan.confirmed ? plan.departmentSlugs : [];
  const completedDepartments = confirmedDepartments.filter((slug) =>
    sessions.some((s) => s.departmentSlug === slug && s.status === 'completed'),
  );
  const postSurveySubmitted = await hasSubmittedPostSurvey(userId, confirmedDepartments);

  return {
    unlocked:
      preSurveyComplete &&
      plan.confirmed &&
      (PLAN_SIZES as readonly number[]).includes(confirmedDepartments.length) &&
      completedDepartments.length === confirmedDepartments.length &&
      postSurveySubmitted,
    preSurveyComplete,
    planConfirmed: plan.confirmed,
    confirmedDepartments,
    requiredDepartments: plan.confirmed ? confirmedDepartments.length : DEFAULT_PLAN_SIZE,
    completedDepartments,
    postSurveySubmitted,
  };
}

/**
 * Whether the post-survey has been submitted — read from the stored survey,
 * and only for the departments of the confirmed plan.
 */
async function hasSubmittedPostSurvey(userId: string, planDepartments: string[]): Promise<boolean> {
  if (planDepartments.length === 0) return false;
  const survey = await getRepository().getCareerPostSurvey(userId);
  return (
    survey?.status === 'submitted' &&
    survey.departmentSlugs.length === planDepartments.length &&
    planDepartments.every((slug) => survey.departmentSlugs.includes(slug))
  );
}
