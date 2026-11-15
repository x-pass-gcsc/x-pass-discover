import 'server-only';
import { getRepository } from '@/db/repository';
import { getDepartmentPlan } from '@/services/departments/plan-service';
import { analyzePlanBehavior } from './behavior-analysis';
import { getReportAccess } from './report-access';
import type { SynthesisInput } from './synthesis';

/**
 * Everything the final report reads, once it is open — or null while it is
 * locked, so nothing of it is ever computed before then.
 */
export async function loadFinalReportInput(userId: string): Promise<SynthesisInput | null> {
  const access = await getReportAccess(userId);
  if (!access.unlocked) return null;
  const repo = getRepository();
  const [plan, preSurvey, postSurvey] = await Promise.all([
    getDepartmentPlan(userId),
    repo.getPreSurvey(userId),
    repo.getCareerPostSurvey(userId),
  ]);
  if (!plan.confirmed || !postSurvey) return null;
  const behavior = await analyzePlanBehavior(userId, plan.departmentSlugs);
  return { plan, preSurveyAnswers: preSurvey?.answers ?? {}, behavior, postSurvey };
}
