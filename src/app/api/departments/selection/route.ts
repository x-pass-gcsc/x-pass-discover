import { z } from 'zod';
import { parseBody, withUser } from '@/lib/api';
import { confirmDepartmentPlan } from '@/services/departments/plan-service';

/**
 * Confirms the student's department plan: the two departments they chose,
 * and — for a plan of three — the signed recommendation they were shown.
 * Without a token the plan is the two alone. The server checks the token, so
 * the third department can never be set by the client. A plan is confirmed
 * once.
 */
const schema = z
  .object({
    userChosenSlugs: z.array(z.string().trim().min(1)).length(2, 'choose exactly two departments'),
    recommendationToken: z.string().trim().min(1).max(8000).nullable().optional(),
  })
  .strict();

export async function POST(request: Request) {
  return withUser(async (user) => {
    const { userChosenSlugs, recommendationToken } = await parseBody(request, schema);
    const plan = await confirmDepartmentPlan(user.id, userChosenSlugs, recommendationToken ?? null);
    return { plan };
  });
}
