'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, KeyRound, Loader2, LogOut, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Me, UserProfile } from '@/lib/types';
import { ErrorState, ListSkeleton, PageHeader } from '@/components/app/common';
import { ConfirmAction } from '@/components/app/confirm-action';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="contents"
      >
        <CardHeader>
          <CardTitle>
            <h2>Personal details</h2>
          </CardTitle>
          <CardDescription>Shared with the clinics you book with, to help them care for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <Field id="p-address" label="Address" className="space-y-1.5 sm:col-span-2">
              <Textarea id="p-address" value={form.address} onChange={set('address')} maxLength={300} autoComplete="street-address" />
            </Field>
          </div>

          <Separator />

          <fieldset className="space-y-4">
            <legend className="mb-4 text-sm font-medium">Emergency contact</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="p-ec-name" label="Name">
                <Input id="p-ec-name" value={form.ecName} onChange={set('ecName')} maxLength={120} />
              </Field>
              <Field id="p-ec-phone" label="Phone">
                <Input id="p-ec-phone" type="tel" value={form.ecPhone} onChange={set('ecPhone')} maxLength={30} />
              </Field>
              <Field id="p-ec-relation" label="Relation">
                <Input id="p-ec-relation" value={form.ecRelation} onChange={set('ecRelation')} maxLength={60} placeholder="e.g. Spouse" />
              </Field>
            </div>
          </fieldset>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={save.isPending || form.name.trim().length < 2}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
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
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <KeyRound className="size-4" /> {hasPassword ? 'Change password' : 'Set a password'}
        </h3>
        <p className="text-xs text-muted-foreground">
          {hasPassword ? 'You’ll be signed out everywhere and asked to sign in again.' : 'You sign in with Google. Add a password to sign in with email too.'}
        </p>
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
        <Button type="submit" disabled={!canSubmit}>
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
      <PageHeader title="Profile" description="Manage your details, security and data." />
      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : isError || !user ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-6">
          <ProfileForm key={user.id} user={user} />

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Security</h2>
              </CardTitle>
              <CardDescription>Member since {formatDate(user.createdAt)}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PasswordCard hasPassword={user.hasPassword} />
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium">Sign out of all devices</h3>
                  <p className="text-xs text-muted-foreground">Ends every session, including this one.</p>
                </div>
                <ConfirmAction
                  trigger={
                    <Button variant="outline">
                      <LogOut /> Sign out everywhere
                    </Button>
                  }
                  title="Sign out of all devices?"
                  description="You’ll need to sign in again on every device, including this one."
                  confirmLabel="Sign out everywhere"
                  onConfirm={logoutAll}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Your data</h2>
              </CardTitle>
              <CardDescription>Download a copy of everything we hold about you, or delete your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium">Export my data</h3>
                  <p className="text-xs text-muted-foreground">Profile, appointments, document list and notifications as JSON.</p>
                </div>
                <Button variant="outline" onClick={exportData} disabled={exporting}>
                  {exporting ? <Loader2 className="animate-spin" /> : <Download />}
                  Export
                </Button>
              </div>
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-destructive">Delete account</h3>
                  <p className="text-xs text-muted-foreground">
                    Permanently deletes your account and documents. Cancel upcoming visits first.
                  </p>
                </div>
                <ConfirmAction
                  trigger={
                    <Button variant="destructive">
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
