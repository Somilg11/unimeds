'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signupAction } from '../actions';
import { Field, FormError, PASSWORD_HINT, SubmitButton } from '@/components/auth/form-bits';

export function SignupForm({ next }: { next: string }) {
  const [state, action] = useActionState(signupAction, undefined);
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your patient account</h1>
        <p className="text-sm text-muted-foreground">Book visits and keep your medical records in one place.</p>
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Full name" name="name" autoComplete="name" required minLength={2} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={10} hint={PASSWORD_HINT} />
        <FormError message={state?.error} />
        <SubmitButton>Create account</SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our{' '}
        <Link href="/legal/terms" className="underline">Terms</Link> and{' '}
        <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
