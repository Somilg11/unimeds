'use client';

import { useActionState } from 'react';
import { acceptInviteAction } from '../../actions';
import { Field, FormError, PASSWORD_HINT, SubmitButton } from '@/components/auth/form-bits';

export function InviteForm({ token, create }: { token: string; create: boolean }) {
  const [state, action] = useActionState(acceptInviteAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {create && (
        <>
          <Field label="Full name" name="name" autoComplete="name" required minLength={2} />
          <Field label="Create a password" name="password" type="password" autoComplete="new-password" required minLength={10} hint={PASSWORD_HINT} />
        </>
      )}
      <FormError message={state?.error} />
      <SubmitButton>{create ? 'Create account & join' : 'Accept invitation'}</SubmitButton>
    </form>
  );
}
