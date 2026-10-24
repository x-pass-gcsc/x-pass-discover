import { z } from 'zod';
import { getRepository } from '@/db/repository';
import { parseBody, withUser } from '@/lib/api';

/** Renames the signed-in account. The email is the account's identity and stays put. */
const schema = z.object({
  displayName: z.string().trim().min(1, 'display name is required').max(80),
});

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await parseBody(request, schema);
    const updated = await getRepository().updateDisplayName(user.id, body.displayName);
    return { user: updated };
  });
}
