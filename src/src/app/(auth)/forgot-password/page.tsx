'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '../actions';
import { Field, FormError, SubmitButton } from '@/components/auth/form-bits';

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">We&apos;ll email you a link to choose a new one.</p>
      </div>
      {state?.ok ? (
        <p className="rounded-md bg-muted px-4 py-3 text-sm">{state.message}</p>
      ) : (
        <form action={action} className="space-y-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <FormError message={state?.error} />
          <SubmitButton>Send reset link</SubmitButton>
        </form>
      )}
      <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
        Back to sign in
      </Link>
    </div>
  );
}
