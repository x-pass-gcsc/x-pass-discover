import { z } from 'zod';
import { parseBody, withUser } from '@/lib/api';
import { previewRecommendation } from '@/services/departments/plan-service';

/**
 * The department that would be recommended for two choices. Only its slug is
 * returned: the pre-survey scores behind it are not shown until the final
 * report.
 */
const schema = z
  .object({
    userChosenSlugs: z.array(z.string().trim().min(1)).length(2, 'choose exactly two departments'),
  })
  .strict();

export async function POST(request: Request) {
  return withUser(async (user) => {
    const { userChosenSlugs } = await parseBody(request, schema);
    return { aiRecommendedSlug: await previewRecommendation(user.id, userChosenSlugs) };
  });
}
