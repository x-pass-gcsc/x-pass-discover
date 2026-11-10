import { z } from 'zod';
import { parseBody, withUser } from '@/lib/api';
import { confirmDepartmentPlan } from '@/services/departments/plan-service';

/**
 * Confirms the student's 2+1 department plan: the two departments they chose,
 * and the recommendation they were shown. The server recomputes the
 * recommendation and refuses the request if it differs, so the third
 * department can never be set by the client. A plan is confirmed once.
 */
const schema = z
  .object({
    userChosenSlugs: z.array(z.string().trim().min(1)).length(2, 'choose exactly two departments'),
    aiRecommendedSlug: z.string().trim().min(1),
  })
  .strict();

export async function POST(request: Request) {
  return withUser(async (user) => {
    const { userChosenSlugs, aiRecommendedSlug } = await parseBody(request, schema);
    const plan = await confirmDepartmentPlan(user.id, userChosenSlugs, aiRecommendedSlug);
    return { plan };
  });
}
