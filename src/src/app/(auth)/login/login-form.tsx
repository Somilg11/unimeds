'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '../actions';
import { Field, FormError, SubmitButton } from '@/components/auth/form-bits';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <div className="space-y-1.5">
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        <Link href="/forgot-password" className="block px-1 text-right text-xs font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <FormError message={state?.error} />
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}
