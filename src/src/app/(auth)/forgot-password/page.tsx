'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '../actions';
import { ArrowLeft } from 'lucide-react';
import { AuthHeader, Field, FormError, FormNotice, SubmitButton } from '@/components/auth/form-bits';

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);
  return (
    <div className="space-y-6">
      <AuthHeader title="Reset your password" description="We’ll email you a link to choose a new one." />
      {state?.ok ? (
        <div role="status">
          <FormNotice>{state.message}</FormNotice>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <FormError message={state?.error} />
          <SubmitButton>Send reset link</SubmitButton>
        </form>
      )}
      <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </div>
  );
}
