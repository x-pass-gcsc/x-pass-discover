import { z, ZodError } from 'zod';
import { NextResponse } from 'next/server';
import {
  InvalidCredentialsError,
  UnauthenticatedError,
  changePassword,
  requireUser,
} from '@/lib/auth/session';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { faultResponse, jsonError, parseBody } from '@/lib/api';

/**
 * Sets the first password, or changes the current one. `currentPassword` is
 * required exactly when the account already has a password.
 */
const schema = z.object({
  currentPassword: z.string().max(1024).optional(),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, schema);
    await changePassword(user, body.currentPassword || undefined, body.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return jsonError('Not signed in', 401);
    }
    if (error instanceof InvalidCredentialsError) {
      return jsonError('The current password is incorrect.', 403, 'wrong_password');
    }
    if (error instanceof ZodError) {
      return jsonError(error.issues[0]?.message ?? 'Invalid request', 400);
    }
    return faultResponse(error, 'The password could not be changed. Please try again.');
  }
}
