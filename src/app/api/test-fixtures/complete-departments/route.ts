import { z } from 'zod';
import { getDepartment } from '@/content/departments';
import { getRepository } from '@/db/repository';
import { jsonError, parseBody, withUser } from '@/lib/api';
import { env } from '@/lib/env';
import { ScenarioRuleError } from '@/lib/errors';
import { getDepartmentPlan } from '@/services/departments/plan-service';

/**
 * TEST ONLY. Marks departments of the signed-in student's confirmed plan as
 * completed, so the post-survey can be tested before every department has a
 * playable scenario.
 *
 * It exists only where both hold: `X_PASS_TEST_FIXTURES=1` (set by the
 * Playwright web server, never by a deployment) and the in-memory store, which
 * is thrown away when the process ends. Anywhere else it is a 404, so it can
 * never touch a real student's records.
 */
const enabled = () => process.env.X_PASS_TEST_FIXTURES === '1' && env.persistenceMode === 'memory';

const schema = z.object({ departmentSlugs: z.array(z.string()).min(1).max(3) }).strict();

export async function POST(request: Request) {
  if (!enabled()) return jsonError('Not found', 404);
  return withUser(async (user) => {
    const { departmentSlugs } = await parseBody(request, schema);
    const plan = await getDepartmentPlan(user.id);
    if (!plan.confirmed || !departmentSlugs.every((slug) => plan.departmentSlugs.includes(slug))) {
      throw new ScenarioRuleError('Only departments of a confirmed plan.', 'not_in_plan');
    }
    const repo = getRepository();
    for (const slug of departmentSlugs) {
      const department = getDepartment(slug)!;
      const session =
        (await repo.findActiveSession(user.id, slug)) ??
        (await repo.createSession({
          userId: user.id,
          departmentSlug: slug,
          projectKey: department.projectKey,
          scenarioKey: department.scenarioKey ?? `test-fixture-${slug}`,
          scenarioVersion: 1,
          deadlineHours: 24,
          initialStepKey: '',
        }));
      await repo.updateSession(session.id, { status: 'completed', completedAt: new Date().toISOString() });
    }
    return { completed: departmentSlugs };
  });
}
