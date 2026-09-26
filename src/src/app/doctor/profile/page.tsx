'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signOut, useSession } from 'next-auth/react';
import { BriefcaseMedical, KeyRound, Loader2, LogOut, ShieldCheck, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import type { Me } from '@/lib/types';
import { ErrorState, ListSkeleton } from '@/components/app/common';
import { ConfirmAction } from '@/components/app/confirm-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconCircle, PersonAvatar } from '../_components/bits';

type ProfileUser = Omit<Me, 'memberships'>;

function Section({ title, description, icon, children }: { title: string; description?: string; icon: LucideIcon; children: React.ReactNode }) {
  const id = title.toLowerCase().replace(/\W+/g, '-');
  return (
    <section className="rounded-3xl bg-card p-5 sm:p-6" aria-labelledby={id}>
      <div className="flex items-center gap-3">
        <IconCircle icon={icon} />
        <div className="min-w-0">
          <h2 id={id} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SubGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl bg-background p-4 sm:p-5">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ProfileForm({ user }: { user: ProfileUser }) {
  const qc = useQueryClient();
  const { update: updateSession } = useSession();
  const p = user.profile ?? {};
  const [form, setForm] = useState({
    name: user.name ?? '',
    phone: p.phone ?? '',
    specialization: p.specialization ?? '',
    licenseNumber: p.licenseNumber ?? '',
    bio: p.bio ?? '',
    yearsOfExperience: p.yearsOfExperience != null ? String(p.yearsOfExperience) : '',
  });
  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  const years = form.yearsOfExperience.trim() === '' ? undefined : Number(form.yearsOfExperience);
  const yearsInvalid = years !== undefined && (!Number.isInteger(years) || years < 0 || years > 70);
  const nameInvalid = form.name.trim().length < 2;

  const save = useMutation({
    mutationFn: () =>
      api.patch<{ user: ProfileUser }>('/doctor/profile', {
        name: form.name.trim(),
        profile: {
          phone: form.phone.trim(),
          specialization: form.specialization.trim(),
          licenseNumber: form.licenseNumber.trim(),
          bio: form.bio.trim(),
          yearsOfExperience: years ?? null,
        },
      }),
    onSuccess: (res) => {
      qc.setQueryData(['doctor', 'profile'], res);
      void updateSession({ name: res.user.name });
      toast.success('Profile saved');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nameInvalid && !yearsInvalid) save.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pf-name">Full name</Label>
          <Input id="pf-name" {...field('name')} maxLength={120} required aria-invalid={nameInvalid} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-email">Email</Label>
          <Input id="pf-email" value={user.email} disabled readOnly />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-spec">Specialization</Label>
          <Input id="pf-spec" {...field('specialization')} maxLength={100} placeholder="e.g. Cardiology" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-phone">Phone</Label>
          <Input id="pf-phone" type="tel" {...field('phone')} maxLength={30} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-license">License number</Label>
          <Input id="pf-license" {...field('licenseNumber')} maxLength={60} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-years">Years of experience</Label>
          <Input id="pf-years" type="number" inputMode="numeric" min={0} max={70} step={1} {...field('yearsOfExperience')} aria-invalid={yearsInvalid} />
          {yearsInvalid && <p className="text-xs text-destructive">Enter a whole number between 0 and 70.</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-bio">Bio</Label>
        <Textarea id="pf-bio" {...field('bio')} rows={5} className="rounded-2xl" maxLength={2000} placeholder="Shown to patients on your public profile." />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="lg" className="h-12 w-full sm:h-10 sm:w-auto" disabled={save.isPending || nameInvalid || yearsInvalid}>
          {save.isPending && <Loader2 className="animate-spin" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{10,}$/;

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const weak = next.length > 0 && !PASSWORD_RULE.test(next);
  const mismatch = confirm.length > 0 && confirm !== next;
  const ready = (!hasPassword || current.length > 0) && PASSWORD_RULE.test(next) && next === confirm;

  const change = useMutation({
    mutationFn: () => api.post('/auth/password/change', { currentPassword: hasPassword ? current : undefined, newPassword: next }),
    onSuccess: () => {
      toast.success('Password changed. Please sign in again.');
      void signOut({ redirectTo: '/login' });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) change.mutate();
      }}
    >
      {hasPassword && (
        <div className="space-y-1.5 sm:max-w-sm">
          <Label htmlFor="pw-current">Current password</Label>
          <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pw-new">New password</Label>
          <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-invalid={weak} />
          <p className={weak ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>At least 10 characters, with a letter and a number.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm">Confirm new password</Label>
          <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch} />
          {mismatch && <p className="text-xs text-destructive">Passwords don&apos;t match.</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Changing your password signs you out on every device, including this one.</p>
      <div className="flex justify-end">
        <Button type="submit" size="lg" variant="secondary" className="h-12 w-full sm:h-10 sm:w-auto" disabled={!ready || change.isPending}>
          {change.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {hasPassword ? 'Change password' : 'Set password'}
        </Button>
      </div>
    </form>
  );
}

export default function DoctorProfilePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor', 'profile'],
    queryFn: () => api.get<{ user: ProfileUser }>('/doctor/profile'),
  });

  const user = data?.user;
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profile</h1>
      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !user ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <div className="flex items-center gap-4 rounded-3xl bg-card p-5">
            <PersonAvatar name={user.name} src={user.avatarUrl} className="size-16 text-lg" />
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.profile?.specialization || 'Doctor'}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Section title="Professional info" description="Your name, specialization and bio are visible to patients." icon={BriefcaseMedical}>
            <ProfileForm key={user.id} user={user} />
          </Section>

          <Section title="Security" description="Password and signed-in devices." icon={ShieldCheck}>
            <div className="space-y-3">
              <SubGroup title="Password" description={user.hasPassword ? undefined : 'You sign in with Google. Set a password to also sign in with email.'}>
                <PasswordForm hasPassword={user.hasPassword} />
              </SubGroup>
              <SubGroup title="Sessions" description="Signed in on a shared or lost device? End every session at once.">
                <ConfirmAction
                  trigger={
                    <Button variant="outline" size="lg" className="h-12 w-full sm:h-10 sm:w-auto">
                      <LogOut /> Sign out everywhere
                    </Button>
                  }
                  title="Sign out on all devices?"
                  description="You'll be signed out everywhere, including here, and will need to sign in again."
                  confirmLabel="Sign out everywhere"
                  destructive
                  onConfirm={async () => {
                    try {
                      await api.post('/auth/logout-all');
                    } catch (err) {
                      toast.error(errorMessage(err));
                      throw err;
                    }
                    toast.success('Signed out on all devices');
                    await signOut({ redirectTo: '/login' });
                  }}
                />
              </SubGroup>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
