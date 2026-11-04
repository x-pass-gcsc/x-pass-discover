import 'server-only';
import { listLocalizedDepartments } from '@/content/departments';
import { getRepository } from '@/db/repository';
import type { Locale } from '@/i18n/config';
import type { DepartmentDefinition } from '@/types/scenario';
import type { SessionSummary } from './department-chooser';

export type DepartmentDesk = {
  departments: DepartmentDefinition[];
  selection: string[];
  sessions: SessionSummary[];
};

/**
 * Everything the department chooser shows for one student: the departments in
 * their language, the three they picked, and each bootcamp they started with
 * how far it has got.
 */
export async function loadDepartmentDesk(userId: string, locale: Locale): Promise<DepartmentDesk> {
  const repo = getRepository();
  const [selection, sessions] = await Promise.all([
    repo.getDepartmentSelection(userId),
    repo.listSessionsForUser(userId),
  ]);
  const progress = await Promise.all(sessions.map((s) => repo.listStepProgress(s.id)));
  return {
    departments: listLocalizedDepartments(locale),
    selection: selection?.departmentSlugs ?? [],
    sessions: sessions.map((s, index) => ({
      id: s.id,
      departmentSlug: s.departmentSlug,
      status: s.status,
      completedSteps: progress[index].filter((p) => p.status === 'completed').length,
      totalSteps: progress[index].length,
    })),
  };
}
