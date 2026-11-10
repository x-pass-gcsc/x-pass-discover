import 'server-only';
import { listLocalizedDepartments } from '@/content/departments';
import { scorePreSurvey50 } from '@/content/pre-survey-rubric-v1';
import { getRepository } from '@/db/repository';
import type { Locale } from '@/i18n/config';
import { planFrom, type DepartmentPlan } from '@/services/departments/plan-service';
import type { DepartmentDefinition } from '@/types/scenario';
import type { SessionSummary } from './department-chooser';

export type DepartmentDesk = {
  departments: DepartmentDefinition[];
  /** The 2+1 plan, or not yet. Carries department slugs only — no scores. */
  plan: DepartmentPlan;
  /** Whether a recommendation can be made yet (whether, not what it says). */
  preSurveyComplete: boolean;
  sessions: SessionSummary[];
};

/**
 * Everything the reception desk shows one student: the departments in their
 * language, their department plan, and each bootcamp they started with how
 * far it has got. Nothing of the pre-survey's result is included.
 */
export async function loadDepartmentDesk(userId: string, locale: Locale): Promise<DepartmentDesk> {
  const repo = getRepository();
  const [selection, sessions, preSurvey] = await Promise.all([
    repo.getDepartmentSelection(userId),
    repo.listSessionsForUser(userId),
    repo.getPreSurvey(userId),
  ]);
  const progress = await Promise.all(sessions.map((s) => repo.listStepProgress(s.id)));
  const plan = planFrom(selection);
  return {
    departments: listLocalizedDepartments(locale),
    // The recommendation's reasons stay on the server: only the slugs travel.
    plan,
    preSurveyComplete: !!preSurvey && scorePreSurvey50(preSurvey.answers).complete,
    sessions: sessions.map((s, index) => ({
      id: s.id,
      departmentSlug: s.departmentSlug,
      status: s.status,
      completedSteps: progress[index].filter((p) => p.status === 'completed').length,
      totalSteps: progress[index].length,
    })),
  };
}
