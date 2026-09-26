'use client';

import { use, useActionState } from 'react';
import { resetPasswordAction } from '../../actions';
import { Field, FormError, PASSWORD_HINT, SubmitButton } from '@/components/auth/form-bits';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, action] = useActionState(resetPasswordAction, undefined);
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">You&apos;ll be signed out everywhere else.</p>
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={10} hint={PASSWORD_HINT} />
        <FormError message={state?.error} />
        <SubmitButton>Update password</SubmitButton>
      </form>
    </div>
  );
}
