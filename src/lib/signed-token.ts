import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';

/**
 * A small signed token: a JSON payload the server hands to the client and
 * later takes back, knowing it was not changed. The payload is readable by
 * the client (base64url), so nothing secret goes in it — only what the
 * client was already shown. `purpose` keeps a token made for one thing from
 * being accepted as another.
 */
function mac(purpose: string, body: string): string {
  return createHmac('sha256', env.authSecret).update(`${purpose}.${body}`).digest('base64url');
}

export function signToken(purpose: string, payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${mac(purpose, body)}`;
}

/** The payload, or null when the token is malformed or was not signed by us. */
export function readToken(purpose: string, token: string): unknown {
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra !== undefined) return null;
  const expected = Buffer.from(mac(purpose, body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
