import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getRepository } from '@/db/repository';
import { env } from '@/lib/env';
import { isMissingSchemaError } from '@/lib/errors';
import type { User, UserCredential } from '@/types/runtime';
import { hashPassword, verifyPassword } from './password';

/**
 * Signed-cookie session with optional passwords.
 *
 * Keeps the narrow seam (`signUp`, `signIn`, `signOut`, `getCurrentUser`) so
 * swapping in Auth.js still means reimplementing this file and little else.
 *
 * Passwords arrived after the first accounts did. Every new account sets one at
 * sign-up; an account created before that has no credential row, keeps signing
 * in with its email alone, and is sent to My Page to set one. Once a password
 * exists it is required, and setting or changing it ends every other session
 * for that account — the cookie carries its issue time, and a cookie issued
 * before the password last changed is no longer honoured.
 *
 * `/login` still says plainly when an address has no account. While
 * password-less accounts exist that leaks nothing a visitor could not learn by
 * signing in; a wrong password, by contrast, gets the same answer whatever the
 * password was.
 */

const COOKIE_NAME = 'x_pass_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sign(payload: string): string {
  return createHmac('sha256', env.authSecret).update(payload).digest('base64url');
}

function encode(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

function decode(token: string): { userId: string; issuedAt: number } | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [userId, issuedAt] = payload.split('.');
  if (!userId || !issuedAt) return null;
  if (Date.now() - Number(issuedAt) > MAX_AGE_SECONDS * 1000) return null;
  return { userId, issuedAt: Number(issuedAt) };
}

async function establishSession(user: User): Promise<User> {
  const store = await cookies();
  store.set(COOKIE_NAME, encode(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return user;
}

let warnedAboutMissingCredentials = false;

/**
 * The account's password, read leniently: a database that has not had the
 * `user_credentials` migration yet behaves exactly as it did before passwords
 * existed, rather than locking every student out. Writes are not lenient —
 * setting a password there fails with the "run the migration" message.
 */
async function readCredential(userId: string): Promise<UserCredential | null> {
  try {
    return await getRepository().getCredential(userId);
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    if (!warnedAboutMissingCredentials) {
      warnedAboutMissingCredentials = true;
      console.error(
        '[auth] user_credentials table missing — run the migration. Passwords are ignored until then.',
      );
    }
    return null;
  }
}

export async function hasPassword(userId: string): Promise<boolean> {
  return (await readCredential(userId)) !== null;
}

/**
 * Signs in an account that already exists. Creating one is `signUp`, and the
 * two are deliberately separate: a single call that silently created an
 * account for a mistyped address would hand the student an empty bootcamp and
 * no clue why their work was gone.
 *
 * `needsPassword` is true for an account that still has none, so the caller
 * can send the student to set one.
 */
export async function signIn(
  email: string,
  password: string | undefined,
): Promise<{ user: User; needsPassword: boolean }> {
  const user = await getRepository().findUserByEmail(email);
  if (!user) throw new AccountNotFoundError();
  const credential = await readCredential(user.id);
  if (credential) {
    if (!password || !(await verifyPassword(password, credential.passwordHash))) {
      throw new InvalidCredentialsError();
    }
  }
  await establishSession(user);
  return { user, needsPassword: !credential };
}

/** Creates the account with its password and signs into it. Refuses an address already in use. */
export async function signUp(
  email: string,
  displayName: string,
  password: string,
): Promise<User> {
  const repository = getRepository();
  const passwordHash = await hashPassword(password);
  // Reaches the credentials table before creating anything, so a database
  // missing the migration refuses here instead of leaving behind an account
  // with no password.
  await repository.getCredential(NIL_UUID);
  const user = await repository.createUser({ email, displayName });
  if (!user) throw new EmailAlreadyRegisteredError();
  await repository.setPasswordHash(user.id, passwordHash, new Date().toISOString());
  return establishSession(user);
}

/**
 * Sets the first password, or changes an existing one — which then needs the
 * current password too. Every other signed-in browser is signed out; this one
 * gets a fresh cookie and stays in.
 */
export async function changePassword(
  user: User,
  currentPassword: string | undefined,
  nextPassword: string,
): Promise<void> {
  const repository = getRepository();
  const credential = await repository.getCredential(user.id);
  if (credential) {
    if (
      !currentPassword ||
      !(await verifyPassword(currentPassword, credential.passwordHash))
    ) {
      throw new InvalidCredentialsError();
    }
  }
  await repository.setPasswordHash(
    user.id,
    await hashPassword(nextPassword),
    new Date().toISOString(),
  );
  await establishSession(user);
}

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * The server's own view of who is calling. Never trust a `user_id` sent in a
 * request body — always resolve identity through this function.
 */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = decode(token);
  if (!session) return null;
  const [user, credential] = await Promise.all([
    getRepository().getUser(session.userId),
    readCredential(session.userId),
  ]);
  // Issued before the password was last set or changed: someone else's browser.
  if (credential && Date.parse(credential.updatedAt) > session.issuedAt) return null;
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export class UnauthenticatedError extends Error {
  constructor() {
    super('Not signed in');
    this.name = 'UnauthenticatedError';
  }
}

export class AccountNotFoundError extends Error {
  constructor() {
    super('No account uses that email address yet.');
    this.name = 'AccountNotFoundError';
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('That email address already has an account.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('The email or password is incorrect.');
    this.name = 'InvalidCredentialsError';
  }
}
