'use server';

import { signIn } from '@/lib/auth';

export async function signInWithGoogle() {
  await signIn('google');
}

// Per-portal sign-in: after a successful Google login the user lands on the
// dashboard for the portal they signed in from.
export async function signInPatient() {
  await signIn('google', { redirectTo: '/user/dashboard' });
}

export async function signInDoctor() {
  await signIn('google', { redirectTo: '/doctor/dashboard' });
}

export async function signInClinic() {
  await signIn('google', { redirectTo: '/clinic/dashboard' });
}

export async function signInAdmin() {
  await signIn('google', { redirectTo: '/admin/dashboard' });
}
