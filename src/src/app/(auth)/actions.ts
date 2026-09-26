'use server';

import { AuthError } from 'next-auth';
import { unstable_rethrow } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { getApiToken, publicApi } from '@/lib/server-api';
import { ApiError } from '@/lib/api-error';
import { safeNext } from '@/lib/roles';
import type { Role } from '@/lib/types';

export type ActionState = { error?: string; ok?: boolean; message?: string } | undefined;

type TokenResponse = { token: string; user: { role: Role } };

async function startSession(data: TokenResponse, next?: string | null) {
  await signIn('backend-token', { token: data.token, redirectTo: safeNext(next, data.user.role) });
}

function fail(err: unknown): ActionState {
  // Let Next's redirect (thrown by signIn on success) propagate
  unstable_rethrow(err);
  if (err instanceof ApiError) return { error: err.message };
  if (err instanceof AuthError) return { error: 'Could not start your session. Please try again.' };
  console.error(err);
  return { error: 'Something went wrong. Please try again.' };
}

const field = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const data = await publicApi<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: field(form, 'email'), password: String(form.get('password') ?? '') }),
    });
    await startSession(data, field(form, 'next'));
  } catch (err) {
    return fail(err);
  }
}

export async function signupAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const data = await publicApi<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: field(form, 'name'), email: field(form, 'email'), password: String(form.get('password') ?? '') }),
    });
    await startSession(data, field(form, 'next') || '/patient');
  } catch (err) {
    return fail(err);
  }
}

export async function googleAction(form: FormData) {
  await signIn('google', { redirectTo: field(form, 'next') || '/login/continue' });
}

export async function forgotPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    await publicApi('/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email: field(form, 'email') }) });
    return { ok: true, message: 'If an account exists for that email, a reset link is on its way.' };
  } catch (err) {
    return fail(err);
  }
}

export async function resetPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const data = await publicApi<TokenResponse>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token: field(form, 'token'), password: String(form.get('password') ?? '') }),
    });
    await startSession(data);
  } catch (err) {
    return fail(err);
  }
}

export async function acceptInviteAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    // Existing accounts accept while signed in; the API checks the session matches the invited email
    const session = await auth();
    const token = session ? await getApiToken() : null;
    const name = field(form, 'name');
    const password = String(form.get('password') ?? '');
    const data = await publicApi<TokenResponse>('/auth/invites/accept', {
      method: 'POST',
      token: token ?? undefined,
      body: JSON.stringify({ token: field(form, 'token'), ...(name ? { name } : {}), ...(password ? { password } : {}) }),
    });
    await startSession(data);
  } catch (err) {
    return fail(err);
  }
}
