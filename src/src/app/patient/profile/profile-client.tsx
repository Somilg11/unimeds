'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, Database, Download, HeartPulse, KeyRound, Loader2, LogOut, ShieldCheck, Siren, Trash2, UserRound, type LucideIcon } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Me, UserProfile } from '@/lib/types';
import { ErrorState, ListSkeleton } from '@/components/app/common';
import { ConfirmAction } from '@/components/app/confirm-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { IconCircle, Panel, PersonAvatar } from '../_components/bits';
import { PK, useMe } from '../_components/shared';

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const UNSET = 'unset'; // Radix Select can't use '' as an item value

type Form = {
  name: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  allergies: string;
  address: string;
  ecName: string;
  ecPhone: string;
  ecRelation: string;
};

const toForm = (u: Me): Form => ({
  name: u.name,
  phone: u.profile.phone ?? '',
  dateOfBirth: u.profile.dateOfBirth ?? '',
  gender: u.profile.gender || UNSET,
  bloodType: u.profile.bloodType || UNSET,
  allergies: u.profile.allergies ?? '',
  address: u.profile.address ?? '',
  ecName: u.profile.emergencyContact?.name ?? '',
  ecPhone: u.profile.emergencyContact?.phone ?? '',
  ecRelation: u.profile.emergencyContact?.relation ?? '',
});

function Field({ id, label, children, className }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className ?? 'space-y-1.5'}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ProfileForm({ user }: { user: Me }) {
  const qc = useQueryClient();
  const { update: updateSession } = useSession();
  const [form, setForm] = useState<Form>(() => toForm(user));
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const today = new Date().toISOString().slice(0, 10);

  const save = useMutation({
    mutationFn: () => {
      const profile: UserProfile = {
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender === UNSET ? '' : form.gender,
        bloodType: form.bloodType === UNSET ? '' : form.bloodType,
        allergies: form.allergies.trim(),
        address: form.address.trim(),
        emergencyContact: { name: form.ecName.trim(), phone: form.ecPhone.trim(), relation: form.ecRelation.trim() },
      };
      return api.patch<{ user: Me }>('/patient/profile', { name: form.name.trim(), profile });
    },
    onSuccess: ({ user: updated }) => {
      qc.setQueryData(PK.me, updated);
      void updateSession({ name: updated.name });
      toast.success('Profile saved');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-4"
    >
      <Panel title="Personal info" icon={UserRound} id="personal" description="Shared with the clinics you book with.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-name" label="Full name">
            <Input id="p-name" value={form.name} onChange={set('name')} minLength={2} maxLength={120} required autoComplete="name" />
          </Field>
          <Field id="p-email" label="Email">
            <Input id="p-email" value={user.email} readOnly disabled aria-describedby="p-email-hint" />
            <p id="p-email-hint" className="text-xs text-muted-foreground">
              Email can’t be changed.
            </p>
          </Field>
          <Field id="p-phone" label="Phone">
            <Input id="p-phone" type="tel" value={form.phone} onChange={set('phone')} maxLength={30} autoComplete="tel" />
          </Field>
          <Field id="p-dob" label="Date of birth">
            <Input id="p-dob" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} max={today} />
          </Field>
          <Field id="p-gender" label="Gender">
            <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
              <SelectTrigger id="p-gender" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Not specified</SelectItem>
                {GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="p-address" label="Address" className="space-y-1.5 sm:col-span-2">
            <Textarea id="p-address" value={form.address} onChange={set('address')} maxLength={300} autoComplete="street-address" />
          </Field>
        </div>
      </Panel>

      <Panel title="Medical info" icon={HeartPulse} id="medical" description="Helps your doctor treat you safely.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-blood" label="Blood type">
            <Select value={form.bloodType} onValueChange={(v) => setForm((f) => ({ ...f, bloodType: v }))}>
              <SelectTrigger id="p-blood" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Not specified</SelectItem>
                {BLOOD_TYPES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="p-allergies" label="Allergies" className="space-y-1.5 sm:col-span-2">
            <Textarea id="p-allergies" value={form.allergies} onChange={set('allergies')} maxLength={1000} placeholder="e.g. Penicillin, peanuts" />
          </Field>
        </div>
      </Panel>

      <Panel title="Emergency contact" icon={Siren} id="emergency" description="Who the clinic should call if needed.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="p-ec-name" label="Name">
            <Input id="p-ec-name" value={form.ecName} onChange={set('ecName')} maxLength={120} autoComplete="off" />
          </Field>
          <Field id="p-ec-phone" label="Phone">
            <Input id="p-ec-phone" type="tel" value={form.ecPhone} onChange={set('ecPhone')} maxLength={30} autoComplete="off" />
          </Field>
          <Field id="p-ec-relation" label="Relation">
            <Input id="p-ec-relation" value={form.ecRelation} onChange={set('ecRelation')} maxLength={60} placeholder="e.g. Spouse" />
          </Field>
        </div>
      </Panel>

      <div className="sticky bottom-24 z-20 lg:bottom-6 lg:flex lg:justify-end">
        <Button type="submit" size="lg" className="h-13 w-full text-base lg:w-auto lg:px-8" disabled={save.isPending || form.name.trim().length < 2}>
          {save.isPending && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

function SettingRow({
  icon,
  title,
  description,
  action,
  destructive,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <IconCircle icon={icon} tone="muted" className={destructive ? 'bg-destructive/10 text-destructive' : undefined} />
        <div className="min-w-0">
          <h3 className={destructive ? 'text-sm font-semibold text-destructive' : 'text-sm font-semibold'}>{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="[&>button]:h-12 [&>button]:w-full sm:[&>button]:h-10 sm:[&>button]:w-auto">{action}</div>
    </div>
  );
}

function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const weak = next.length > 0 && (next.length < 10 || !/[a-z]/i.test(next) || !/\d/.test(next));
  const mismatch = confirm.length > 0 && confirm !== next;

  const change = useMutation({
    mutationFn: () => api.post('/auth/password/change', hasPassword ? { currentPassword: current, newPassword: next } : { newPassword: next }),
    onSuccess: async () => {
      // The API revoked every session, including this cookie's token, so sign in again.
      toast.success('Password changed, please sign in again');
      await signOut({ redirectTo: '/login' });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const canSubmit = next && confirm === next && !weak && (!hasPassword || current) && !change.isPending;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) change.mutate();
      }}
    >
      <div className="flex items-start gap-3">
        <IconCircle icon={KeyRound} tone="muted" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{hasPassword ? 'Change password' : 'Set a password'}</h3>
          <p className="text-xs text-muted-foreground">
            {hasPassword ? 'You’ll be signed out everywhere and asked to sign in again.' : 'You sign in with Google. Add a password to sign in with email too.'}
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {hasPassword && (
          <Field id="pw-current" label="Current password">
            <Input id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          </Field>
        )}
        <Field id="pw-new" label="New password">
          <Input
            id="pw-new"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            aria-invalid={weak || undefined}
            aria-describedby="pw-hint"
            required
          />
        </Field>
        <Field id="pw-confirm" label="Confirm new password">
          <Input
            id="pw-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            aria-invalid={mismatch || undefined}
            required
          />
        </Field>
      </div>
      <p id="pw-hint" className={weak || mismatch ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
        {mismatch ? 'Passwords don’t match.' : 'At least 10 characters, with a letter and a number.'}
      </p>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" size="lg" className="h-12 w-full sm:h-10 sm:w-auto" disabled={!canSubmit}>
          {change.isPending && <Loader2 className="animate-spin" />}
          {hasPassword ? 'Change password' : 'Set password'}
        </Button>
      </div>
    </form>
  );
}

export function ProfileClient() {
  const { data: user, isLoading, isError, error, refetch } = useMe();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/backend/patient/export', { credentials: 'same-origin' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `unimeds-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Your data export has downloaded');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
      toast.success('Signed out of all devices');
      await signOut({ redirectTo: '/login' });
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/patient/account', { confirm: 'DELETE' });
      toast.success('Your account has been deleted');
      await signOut({ redirectTo: '/login' });
    } catch (err) {
      toast.error(errorMessage(err), { duration: 8000 });
      throw err;
    }
  };

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">Profile</h1>
      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : isError || !user ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-6">
          <section aria-label="Account" className="rounded-3xl bg-card p-6 text-center lg:sticky lg:top-6">
            <PersonAvatar name={user.name} src={user.avatarUrl} className="mx-auto size-24 [&_[data-slot=avatar-fallback]]:text-2xl" />
            <h2 className="mt-4 truncate text-xl font-bold tracking-tight">{user.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" /> Member since {formatDate(user.createdAt)}
            </p>
          </section>

          <div className="min-w-0 space-y-4">
            <ProfileForm key={user.id} user={user} />

            <Panel title="Security" icon={ShieldCheck} id="security" description="Password and sessions.">
              <div className="space-y-5">
                <PasswordCard hasPassword={user.hasPassword} />
                <Separator />
                <SettingRow
                  icon={LogOut}
                  title="Sign out of all devices"
                  description="Ends every session, including this one."
                  action={
                    <ConfirmAction
                      trigger={
                        <Button variant="outline" size="lg">
                          <LogOut /> Sign out everywhere
                        </Button>
                      }
                      title="Sign out of all devices?"
                      description="You’ll need to sign in again on every device, including this one."
                      confirmLabel="Sign out everywhere"
                      onConfirm={logoutAll}
                    />
                  }
                />
              </div>
            </Panel>

            <Panel title="Your data" icon={Database} id="data" description="Download a copy of everything we hold, or delete your account.">
              <div className="space-y-5">
                <SettingRow
                  icon={Download}
                  title="Export my data"
                  description="Profile, appointments, document list and notifications as JSON."
                  action={
                    <Button variant="outline" size="lg" onClick={exportData} disabled={exporting}>
                      {exporting ? <Loader2 className="animate-spin" /> : <Download />}
                      Export
                    </Button>
                  }
                />
                <Separator />
                <SettingRow
                  icon={Trash2}
                  destructive
                  title="Delete account"
                  description="Permanently deletes your account and documents. Cancel upcoming visits first."
                  action={
                    <ConfirmAction
                      trigger={
                        <Button variant="destructive" size="lg">
                          <Trash2 /> Delete account
                        </Button>
                      }
                      title="Delete your account?"
                      description="This permanently deletes your profile and uploaded documents. It can’t be undone."
                      confirmLabel="Delete my account"
                      destructive
                      confirmPhrase="DELETE"
                      onConfirm={deleteAccount}
                    />
                  }
                />
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
