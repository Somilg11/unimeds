'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, Loader2, LogOut } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, ROLE_LABEL } from '@/lib/format';
import type { Me } from '@/lib/types';
import { ConfirmAction } from '@/components/app/confirm-action';
import { ErrorState, PageHeader } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

function passwordProblem(pw: string) {
  if (pw.length < 10) return 'Use at least 10 characters.';
  if (!/[a-z]/i.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one digit.';
  return null;
}

export default function AccountPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ user: Me }>('/auth/me'),
  });

  return (
    <>
      <PageHeader title="Account" description="Your platform administrator sign-in and sessions." />
      {isPending ? (
        <div className="space-y-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="max-w-2xl space-y-6">
          <section aria-labelledby="profile-heading" className="rounded-xl border bg-card p-5">
            <h2 id="profile-heading" className="sr-only">
              Profile
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{data.user.name}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">{data.user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium">
                  {ROLE_LABEL[data.user.role]} · since {formatDate(data.user.createdAt)}
                </dd>
              </div>
            </dl>
          </section>
          <ChangePassword hasPassword={data.user.hasPassword} />
          <SignOutEverywhere />
        </div>
      )}
    </>
  );
}

function ChangePassword({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);

  const problem = passwordProblem(next) ?? (confirm !== next ? 'Passwords do not match.' : null);

  const change = useMutation({
    mutationFn: () => api.post('/auth/password/change', { currentPassword: hasPassword ? current : undefined, newPassword: next }),
    onSuccess: async () => {
      toast.success('Password changed. Please sign in again.');
      await signOut({ redirectTo: '/login' });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <section aria-labelledby="password-heading" className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="size-4 text-muted-foreground" aria-hidden />
        <h2 id="password-heading" className="font-medium">
          {hasPassword ? 'Change password' : 'Set a password'}
        </h2>
      </div>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (problem) return;
          change.mutate();
        }}
      >
        {hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
              aria-describedby="password-hint"
              aria-invalid={(touched && Boolean(problem)) || undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={(touched && Boolean(problem)) || undefined}
            />
          </div>
        </div>
        <p id="password-hint" className={`text-sm ${touched && problem ? 'text-destructive' : 'text-muted-foreground'}`} role={touched && problem ? 'alert' : undefined}>
          {touched && problem ? problem : 'At least 10 characters, with a letter and a digit. You will be signed out of every device, including this one.'}
        </p>
        <div>
          <Button type="submit" disabled={change.isPending}>
            {change.isPending && <Loader2 className="animate-spin" />}
            {hasPassword ? 'Change password' : 'Set password'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function SignOutEverywhere() {
  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
    toast.success('Signed out of all devices');
    await signOut({ redirectTo: '/login' });
  };

  return (
    <section aria-labelledby="sessions-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h2 id="sessions-heading" className="font-medium">
          Sign out everywhere
        </h2>
        <p className="text-sm text-muted-foreground">Ends every session on every device, including this one.</p>
      </div>
      <ConfirmAction
        trigger={
          <Button variant="outline" className="shrink-0">
            <LogOut /> Sign out everywhere
          </Button>
        }
        title="Sign out of all devices?"
        description="You'll need to sign in again on every device, including this one."
        confirmLabel="Sign out everywhere"
        destructive
        onConfirm={logoutAll}
      />
    </section>
  );
}
