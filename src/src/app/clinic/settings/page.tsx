'use client';

import { useMemo, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, CalendarCog, Loader2, LocateFixed, LogOut, ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { ClinicSettings, Me } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErrorState, ListSkeleton, PageHeader } from '@/components/app/common';
import { ConfirmAction } from '@/components/app/confirm-action';
import { clinicKeys, useClinic } from '../_components/hooks';
import { IconCircle } from '../_components/panel';
import type { Clinic } from '../_components/types';

const SLOT_LENGTHS = [10, 15, 20, 30, 45, 60];

/** White rounded-3xl card on the grey canvas: no border, no shadow. */
const CARD = 'rounded-3xl shadow-none ring-0 dark:ring-0';

function timezones(current: string) {
  let list: string[] = [];
  try {
    list = Intl.supportedValuesOf('timeZone');
  } catch {
    list = [];
  }
  return list.includes(current) ? list : [current, ...list];
}

function Field({ id, label, children, hint, className }: { id: string; label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const nullable = (s: string) => (s.trim() ? s.trim() : null);

function useSaveClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch<{ clinic: Clinic }>('/clinic', body),
    onSuccess: ({ clinic }) => {
      qc.setQueryData(clinicKeys.profile, clinic);
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'clinic' && q.queryKey[1] !== 'profile' });
      qc.invalidateQueries({ queryKey: ['slots'] });
      toast.success('Settings saved');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

function ProfileForm({ clinic }: { clinic: Clinic }) {
  const save = useSaveClinic();
  const [f, setF] = useState({
    name: clinic.name,
    phone: clinic.phone ?? '',
    description: clinic.description ?? '',
    address: clinic.address ?? '',
    city: clinic.city ?? '',
    state: clinic.state ?? '',
    zipCode: clinic.zipCode ?? '',
    latitude: clinic.latitude?.toString() ?? '',
    longitude: clinic.longitude?.toString() ?? '',
    timezone: clinic.timezone,
  });
  const [locating, setLocating] = useState(false);
  const zones = useMemo(() => timezones(clinic.timezone), [clinic.timezone]);
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const lat = f.latitude.trim() === '' ? null : Number(f.latitude);
  const lng = f.longitude.trim() === '' ? null : Number(f.longitude);
  const coordError =
    (lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) || (lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180))
      ? 'Latitude must be between -90 and 90, longitude between -180 and 180.'
      : (lat === null) !== (lng === null)
        ? 'Enter both latitude and longitude, or neither.'
        : null;

  const locate = () => {
    if (!('geolocation' in navigator)) return toast.error('Location isn’t available in this browser');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setF((s) => ({ ...s, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
      },
      (err) => {
        toast.error(err.code === err.PERMISSION_DENIED ? 'Location permission was denied' : 'Couldn’t get your location');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (coordError) return;
    save.mutate({
      name: f.name.trim(),
      phone: nullable(f.phone),
      description: nullable(f.description),
      address: nullable(f.address),
      city: nullable(f.city),
      state: nullable(f.state),
      zipCode: nullable(f.zipCode),
      latitude: lat,
      longitude: lng,
      timezone: f.timezone,
    });
  };

  return (
    <Card className={CARD}>
      <form onSubmit={submit} className="contents">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <IconCircle icon={Building2} />
            Clinic profile
          </CardTitle>
          <CardDescription className="pl-13">Shown to patients when they search and book.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="s-name" label="Clinic name">
            <Input id="s-name" required minLength={2} maxLength={120} value={f.name} onChange={upd('name')} />
          </Field>
          <Field id="s-phone" label="Phone">
            <Input id="s-phone" type="tel" maxLength={30} value={f.phone} onChange={upd('phone')} />
          </Field>
          <Field id="s-desc" label="Description" className="sm:col-span-2">
            <Textarea id="s-desc" maxLength={2000} rows={4} value={f.description} onChange={upd('description')} />
          </Field>
          <Field id="s-address" label="Address" className="sm:col-span-2">
            <Input id="s-address" maxLength={300} value={f.address} onChange={upd('address')} />
          </Field>
          <Field id="s-city" label="City">
            <Input id="s-city" maxLength={100} value={f.city} onChange={upd('city')} />
          </Field>
          <Field id="s-state" label="State">
            <Input id="s-state" maxLength={100} value={f.state} onChange={upd('state')} />
          </Field>
          <Field id="s-zip" label="ZIP / PIN code">
            <Input id="s-zip" maxLength={20} value={f.zipCode} onChange={upd('zipCode')} />
          </Field>
          <Field id="s-tz" label="Timezone" hint="Appointment times and schedules use this zone.">
            <Select value={f.timezone} onValueChange={(v) => setF((s) => ({ ...s, timezone: v }))}>
              <SelectTrigger id="s-tz" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {zones.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field id="s-lat" label="Latitude">
                <Input id="s-lat" inputMode="decimal" value={f.latitude} onChange={upd('latitude')} aria-invalid={Boolean(coordError)} />
              </Field>
              <Field id="s-lng" label="Longitude">
                <Input id="s-lng" inputMode="decimal" value={f.longitude} onChange={upd('longitude')} aria-invalid={Boolean(coordError)} />
              </Field>
              <Button type="button" variant="outline" onClick={locate} disabled={locating}>
                {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                Use my location
              </Button>
            </div>
            <p className={coordError ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
              {coordError ?? 'Used for “near me” search. Use your location while at the clinic, or enter coordinates from a map.'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={save.isPending || Boolean(coordError) || f.name.trim().length < 2}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Save profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function BookingForm({ clinic }: { clinic: Clinic }) {
  const save = useSaveClinic();
  const [s, setS] = useState<ClinicSettings>(clinic.settings);
  const [windowText, setWindowText] = useState(String(clinic.settings.bookingWindowDays));
  const [cancelText, setCancelText] = useState(String(clinic.settings.cancellationHours));
  const windowDays = Number(windowText);
  const cancelHours = Number(cancelText);
  const windowOk = Number.isInteger(windowDays) && windowDays >= 1 && windowDays <= 180;
  const cancelOk = Number.isInteger(cancelHours) && cancelHours >= 0 && cancelHours <= 168;

  return (
    <Card className={CARD}>
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          if (!windowOk || !cancelOk) return;
          save.mutate({ settings: { ...s, bookingWindowDays: windowDays, cancellationHours: cancelHours } });
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <IconCircle icon={CalendarCog} />
            Booking settings
          </CardTitle>
          <CardDescription className="pl-13">Controls the times patients can book online.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field id="b-slot" label="Appointment length">
            <Select value={String(s.slotDurationMinutes)} onValueChange={(v) => setS((x) => ({ ...x, slotDurationMinutes: Number(v) }))}>
              <SelectTrigger id="b-slot" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_LENGTHS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="b-window" label="Booking window (days)" hint={windowOk ? 'How far ahead patients can book.' : 'Enter 1–180 days.'}>
            <Input id="b-window" type="number" min={1} max={180} value={windowText} onChange={(e) => setWindowText(e.target.value)} aria-invalid={!windowOk} />
          </Field>
          <Field
            id="b-cancel"
            label="Cancellation notice (hours)"
            hint={cancelOk ? 'Patients can’t cancel a confirmed visit closer than this.' : 'Enter 0–168 hours.'}
          >
            <Input id="b-cancel" type="number" min={0} max={168} value={cancelText} onChange={(e) => setCancelText(e.target.value)} aria-invalid={!cancelOk} />
          </Field>
          <label className="flex items-start justify-between gap-4 rounded-2xl bg-muted/60 p-4 sm:col-span-3" htmlFor="b-auto">
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">Auto-confirm online bookings</span>
              <span className="block text-xs text-muted-foreground">When off, new bookings wait in “Awaiting confirmation” until your team confirms them.</span>
            </span>
            <Switch id="b-auto" checked={s.autoConfirm} onCheckedChange={(v) => setS((x) => ({ ...x, autoConfirm: v }))} />
          </label>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={save.isPending || !windowOk || !cancelOk}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Save booking settings
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SecurityCard() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get<{ user: Me }>('/auth/me')).user });
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const hasPassword = me?.hasPassword ?? true;

  const strong = next.length >= 10 && /[a-z]/i.test(next) && /\d/.test(next);
  const mismatch = confirm.length > 0 && confirm !== next;

  const change = useMutation({
    mutationFn: () => api.post('/auth/password/change', { currentPassword: hasPassword ? current : undefined, newPassword: next }),
    onSuccess: () => {
      toast.success('Password changed. Please sign in again.');
      // All sessions (including this one's stored token) were revoked
      setTimeout(() => void signOut({ redirectTo: '/login' }), 1200);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card className={CARD}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <IconCircle icon={ShieldCheck} />
            Account security
          </CardTitle>
        <CardDescription className="pl-13">{me ? `Signed in as ${me.email}` : 'Your sign-in details'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (strong && !mismatch && confirm) change.mutate();
          }}
        >
          <h3 className="text-sm font-medium sm:col-span-3">{hasPassword ? 'Change password' : 'Set a password'}</h3>
          {hasPassword && (
            <Field id="p-current" label="Current password">
              <Input id="p-current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
          )}
          <Field id="p-new" label="New password" hint="At least 10 characters with a letter and a number.">
            <Input id="p-new" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Field id="p-confirm" label="Confirm new password" hint={mismatch ? 'Passwords don’t match.' : undefined}>
            <Input
              id="p-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={mismatch}
            />
          </Field>
          <div className="flex items-center justify-between gap-3 sm:col-span-3">
            <p className="text-xs text-muted-foreground">You&apos;ll be signed out on every device and asked to sign in again.</p>
            <Button type="submit" disabled={!strong || mismatch || !confirm || (hasPassword && !current) || change.isPending || change.isSuccess}>
              {change.isPending && <Loader2 className="animate-spin" />}
              Update password
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium">Sign out everywhere</h3>
            <p className="text-xs text-muted-foreground">Ends all sessions on all devices, including this one.</p>
          </div>
          <ConfirmAction
            trigger={
              <Button variant="outline">
                <LogOut /> Sign out everywhere
              </Button>
            }
            title="Sign out of all devices?"
            description="You'll need to sign in again everywhere, including here."
            confirmLabel="Sign out everywhere"
            destructive
            onConfirm={async () => {
              try {
                await api.post('/auth/logout-all');
              } catch (err) {
                toast.error(errorMessage(err));
                throw err;
              }
              await signOut({ redirectTo: '/login' });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClinicSettingsPage() {
  const { data: clinic, isLoading, error, refetch } = useClinic();
  return (
    <>
      <PageHeader title="Settings" description="Clinic profile, booking rules and your account." />
      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : error || !clinic ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="max-w-4xl space-y-8">
          <section aria-labelledby="grp-clinic" className="space-y-4">
            <h2 id="grp-clinic" className="text-sm font-medium text-muted-foreground">
              Clinic
            </h2>
            <ProfileForm clinic={clinic} />
            <BookingForm clinic={clinic} />
          </section>
          <section aria-labelledby="grp-account" className="space-y-4">
            <h2 id="grp-account" className="text-sm font-medium text-muted-foreground">
              Your account
            </h2>
            <SecurityCard />
          </section>
        </div>
      )}
    </>
  );
}
