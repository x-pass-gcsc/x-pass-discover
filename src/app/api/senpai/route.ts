import { z } from 'zod';
import { faultResponse, jsonError } from '@/lib/api';
import { UnauthenticatedError, requireUser } from '@/lib/auth/session';
import { getLocale } from '@/i18n/server';
import {
  SenpaiDeclinedError,
  buildSenpaiSystemPrompt,
  getSenpaiService,
  takeSenpaiQuota,
} from '@/services/senpai';

/**
 * Ask the AI senpai.
 *
 * The browser keeps the conversation and sends the recent turns with each
 * question; the server keeps nothing. The reply streams back as plain text.
 * The system prompt, and the student context it is built from, never leave
 * the server.
 */

export const dynamic = 'force-dynamic';

const MAX_TURNS = 20;
const MAX_CHARS = 2000;

const bodySchema = z.object({
  turns: z
    .array(
      z.object({
        role: z.enum(['student', 'senpai']),
        content: z.string().trim().min(1).max(MAX_CHARS * 3),
      }),
    )
    .min(1)
    .max(200),
  path: z.string().max(300).default('/'),
  sessionId: z.string().max(100).nullable().default(null),
});

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof UnauthenticatedError) return jsonError('Not signed in', 401);
    return faultResponse(error, 'Something went wrong. Please try again.');
  }

  let body: z.output<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return jsonError('Invalid request', 400);
  }

  // Only the recent past goes to the model, and it must end on a question.
  const turns = body.turns.slice(-MAX_TURNS);
  while (turns.length && turns[0].role !== 'student') turns.shift();
  const question = turns.at(-1);
  if (!question || question.role !== 'student') return jsonError('Ask a question first', 400);
  if (question.content.length > MAX_CHARS) {
    return jsonError(`Please keep a question under ${MAX_CHARS} characters.`, 400, 'too_long');
  }

  const wait = takeSenpaiQuota(user.id);
  if (wait !== null) {
    return jsonError('Too many questions in a short time.', 429, 'rate_limited', {
      retryAfterSeconds: wait,
    });
  }

  const locale = await getLocale();
  const service = getSenpaiService();
  const system = await buildSenpaiSystemPrompt({
    user,
    locale,
    path: body.path,
    sessionId: body.sessionId,
  });

  const iterator = service.stream({ system, turns, locale })[Symbol.asyncIterator]();

  // Wait for the first piece before answering, so a bad key or an outage is a
  // proper error status rather than an empty 200.
  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (error) {
    if (error instanceof SenpaiDeclinedError) {
      return jsonError('The senpai could not answer that one.', 422, 'declined');
    }
    console.error('[senpai]', error);
    return jsonError('The senpai is not available right now.', 502, 'upstream');
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));
        while (!first.done) {
          const next = await iterator.next();
          if (next.done) break;
          controller.enqueue(encoder.encode(next.value));
        }
      } catch (error) {
        // The reply already started; end it where it is.
        console.error('[senpai] stream interrupted:', error);
      } finally {
        controller.close();
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-senpai-provider': service.provider,
    },
  });
}
