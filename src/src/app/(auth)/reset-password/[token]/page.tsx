'use client';

import { use, useActionState } from 'react';
import { resetPasswordAction } from '../../actions';
import { AuthHeader, Field, FormError, PASSWORD_HINT, SubmitButton } from '@/components/auth/form-bits';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, action] = useActionState(resetPasswordAction, undefined);
  return (
    <div className="space-y-6">
      <AuthHeader title="Choose a new password" description="You’ll be signed out everywhere else." />
      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={10} hint={PASSWORD_HINT} />
        <FormError message={state?.error} />
        <SubmitButton>Update password</SubmitButton>
      </form>
    </div>
  );
}
