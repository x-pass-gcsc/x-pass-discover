import { z } from 'zod';
import { getLocale, getT } from '@/i18n/server';
import { parseBody, withUser } from '@/lib/api';
import { previewRecommendation } from '@/services/departments/plan-service';

/**
 * The department recommended for two choices: its slug, the reason the
 * student reads, whether Claude or the rules made the pick, and a signed
 * token that confirms exactly this recommendation. The pre-survey scores
 * behind it are not returned: they are not shown until the final report.
 */
const schema = z
  .object({
    userChosenSlugs: z.array(z.string().trim().min(1)).length(2, 'choose exactly two departments'),
  })
  .strict();

export async function POST(request: Request) {
  return withUser(async (user) => {
    const { userChosenSlugs } = await parseBody(request, schema);
    const [locale, t] = await Promise.all([getLocale(), getT()]);
    const { offer, token } = await previewRecommendation(user.id, userChosenSlugs, locale, t);
    return {
      aiRecommendedSlug: offer.recommended,
      reason: offer.reason,
      source: offer.source,
      recommendationToken: token,
    };
  });
}
