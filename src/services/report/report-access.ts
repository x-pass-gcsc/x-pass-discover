import 'server-only';
import { scorePreSurvey50 } from '@/content/pre-survey-rubric-v1';
import { getRepository } from '@/db/repository';
import { planFrom } from '@/services/departments/plan-service';

/** How many departments a student explores before the final report. */
export const REQUIRED_DEPARTMENTS = 3;

/**
 * Whether a student may see their final report — and with it, anything that
 * reads their pre-survey back to them (scores, areas, recommended jobs).
 *
 * The pre-survey is saved and scored when it is submitted, but its result is
 * withheld until the end, so it cannot steer which departments the student
 * tries or how they behave in them. The report opens only when all three hold:
 *
 *   1. the 50-question pre-survey is complete,
 *   2. the 2+1 department plan is confirmed (two chosen, one recommended),
 *      and each of its three departments has a completed bootcamp,
 *   3. the post-survey has been submitted.
 *
 * Every check reads real records only; nothing is assumed done.
 */
export type ReportAccess = {
  unlocked: boolean;
  preSurveyComplete: boolean;
  /** Whether the 2+1 plan is confirmed. */
  planConfirmed: boolean;
  /** The plan's three departments; empty until it is confirmed. */
  confirmedDepartments: string[];
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
      confirmedDepartments.length === REQUIRED_DEPARTMENTS &&
      completedDepartments.length === REQUIRED_DEPARTMENTS &&
      postSurveySubmitted,
    preSurveyComplete,
    planConfirmed: plan.confirmed,
    confirmedDepartments,
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
