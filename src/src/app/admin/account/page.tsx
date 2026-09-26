'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, KeyRound, Loader2, LogOut, Mail, MonitorSmartphone, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, initials, ROLE_LABEL } from '@/lib/format';
import type { Me } from '@/lib/types';
import { ConfirmAction } from '@/components/app/confirm-action';
import { ErrorState, PageHeader } from '@/components/app/common';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { IconCircle, RolePill } from '../_components/bits';

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
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-3xl" />
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-80 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
          </div>
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section aria-labelledby="profile-heading" className="rounded-3xl bg-card p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="size-20">
                <AvatarFallback className="bg-accent text-2xl font-bold text-accent-foreground">{initials(data.user.name)}</AvatarFallback>
              </Avatar>
              <h2 id="profile-heading" className="mt-4 text-lg font-semibold tracking-tight">
                {data.user.name}
              </h2>
              <p className="max-w-full truncate text-sm text-muted-foreground">{data.user.email}</p>
              <RolePill role={data.user.role} className="mt-3" />
            </div>
            <dl className="mt-6 space-y-1 border-t pt-4 text-sm">
              <ProfileRow icon={UserRound} label="Name" value={data.user.name} />
              <ProfileRow icon={Mail} label="Email" value={data.user.email} />
              <ProfileRow icon={ShieldCheck} label="Role" value={ROLE_LABEL[data.user.role]} />
              <ProfileRow icon={CalendarDays} label="Member since" value={formatDate(data.user.createdAt)} />
            </dl>
          </section>

          <div className="space-y-6 lg:col-span-2">
            <h2 className="sr-only">Security</h2>
            <ChangePassword hasPassword={data.user.hasPassword} />
            <SignOutEverywhere />
          </div>
        </div>
      )}
    </>
  );
}

function ProfileRow({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <IconCircle icon={icon} tone="muted" className="size-9" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate font-medium">{value}</dd>
      </div>
    </div>
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
    <section aria-labelledby="password-heading" className="rounded-3xl bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <IconCircle icon={KeyRound} />
        <div>
          <h3 id="password-heading" className="text-lg font-semibold tracking-tight">
            {hasPassword ? 'Change password' : 'Set a password'}
          </h3>
          <p className="text-sm text-muted-foreground">Signs you out of every device once saved.</p>
        </div>
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
        <div className="border-t pt-4">
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
    <section aria-labelledby="sessions-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-center gap-3">
        <IconCircle icon={MonitorSmartphone} />
        <div className="space-y-0.5">
          <h3 id="sessions-heading" className="text-lg font-semibold tracking-tight">
            Sign out everywhere
          </h3>
          <p className="text-sm text-muted-foreground">Ends every session on every device, including this one.</p>
        </div>
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
