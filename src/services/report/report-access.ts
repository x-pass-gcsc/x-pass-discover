import 'server-only';
import { scorePreSurvey50 } from '@/content/pre-survey-rubric-v1';
import { getRepository } from '@/db/repository';

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
 *   2. every one of the student's confirmed departments has a completed
 *      bootcamp, and there are three of them,
 *   3. the post-survey has been submitted.
 *
 * Every check reads real records only. Nothing that does not exist yet is
 * assumed done: there is no post-survey, so (3) is never met and the report
 * stays locked — on purpose, until it is built.
 */
export type ReportAccess = {
  unlocked: boolean;
  preSurveyComplete: boolean;
  /** The departments the student has confirmed, as far as the app records it. */
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
  const confirmedDepartments = confirmedDepartmentsFrom(selection?.departmentSlugs ?? []);
  const completedDepartments = confirmedDepartments.filter((slug) =>
    sessions.some((s) => s.departmentSlug === slug && s.status === 'completed'),
  );
  const postSurveySubmitted = await hasSubmittedPostSurvey(userId);

  return {
    unlocked:
      preSurveyComplete &&
      confirmedDepartments.length === REQUIRED_DEPARTMENTS &&
      completedDepartments.length === REQUIRED_DEPARTMENTS &&
      postSurveySubmitted,
    preSurveyComplete,
    confirmedDepartments,
    completedDepartments,
    postSurveySubmitted,
  };
}

/**
 * The student's confirmed departments. Today that is the saved selection (up
 * to three, chosen at the reception desk). When the "two chosen + one
 * recommended" confirmation exists, read it here instead.
 */
function confirmedDepartmentsFrom(selection: string[]): string[] {
  return Array.from(new Set(selection)).slice(0, REQUIRED_DEPARTMENTS);
}

/**
 * Whether the post-survey has been submitted. There is no post-survey yet, so
 * there is nothing to read and the answer is no. Replace this with a read of
 * the stored post-survey when it is built.
 */
async function hasSubmittedPostSurvey(userId: string): Promise<boolean> {
  void userId;
  return false;
}
