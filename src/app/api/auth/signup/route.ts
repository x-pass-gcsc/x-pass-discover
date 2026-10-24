import { z, ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { EmailAlreadyRegisteredError, signUp } from '@/lib/auth/session';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { faultResponse, jsonError, parseBody } from '@/lib/api';

/** Creates an account and signs into it. Returning students use `/api/auth/login`. */
const schema = z.object({
  email: z.string().email('a valid email is required'),
  displayName: z.string().trim().min(1, 'display name is required').max(80),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    const user = await signUp(body.email, body.displayName, body.password);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      return jsonError(error.message, 409, 'email_taken');
    }
    if (error instanceof ZodError) {
      return jsonError(error.issues[0]?.message ?? 'Invalid request', 400);
    }
    return faultResponse(error, 'Sign-up failed. Please try again.');
  }
}
