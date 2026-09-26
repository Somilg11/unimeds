'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InviteLinkResult } from './bits';
import { PLANS, PLAN_LABEL, type AdminClinic, type Plan } from './types';

type CreateResult = { clinic: AdminClinic; inviteUrl: string; emailSent: boolean };

const EMPTY = { name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', latitude: '', longitude: '' };

function timezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['Asia/Kolkata', 'UTC'];
  }
}

export function OnboardClinicDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Onboard clinic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">{open && <OnboardForm onClose={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  );
}

function OnboardForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [zones] = useState(timezones);
  const [form, setForm] = useState(EMPTY);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [plan, setPlan] = useState<Plan>('starter');
  const [result, setResult] = useState<CreateResult | null>(null);

  const field = (key: keyof typeof EMPTY) => ({
    id: `onboard-${key}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const lat = form.latitude.trim();
  const lng = form.longitude.trim();
  const coordError =
    (lat && (Number.isNaN(Number(lat)) || Math.abs(Number(lat)) > 90) && 'Latitude must be between -90 and 90') ||
    (lng && (Number.isNaN(Number(lng)) || Math.abs(Number(lng)) > 180) && 'Longitude must be between -180 and 180') ||
    (Boolean(lat) !== Boolean(lng) && 'Enter both latitude and longitude, or neither') ||
    '';

  const create = useMutation({
    mutationFn: () => {
      const opt = (v: string) => v.trim() || undefined;
      return api.post<CreateResult>('/admin/clinics', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: opt(form.phone),
        address: opt(form.address),
        city: opt(form.city),
        state: opt(form.state),
        zipCode: opt(form.zipCode),
        latitude: lat ? Number(lat) : undefined,
        longitude: lng ? Number(lng) : undefined,
        timezone,
        plan,
      });
    },
    onSuccess: (res) => {
      setResult(res);
      toast.success(`${res.clinic.name} created`);
      qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (result) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{result.clinic.name} is set up</DialogTitle>
          <DialogDescription>
            The clinic stays <strong>invited</strong> until its admin accepts the invitation. Once they do, it becomes active.
          </DialogDescription>
        </DialogHeader>
        <InviteLinkResult url={result.inviteUrl} emailSent={result.emailSent} email={result.clinic.email} />
        <DialogFooter>
          <Button variant="outline" asChild>
            <Link href={`/admin/clinics/${result.clinic.id}`}>View clinic</Link>
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (coordError) return;
        create.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>Onboard a clinic</DialogTitle>
        <DialogDescription>Creates the clinic and invites its first admin. You&apos;ll get an invite link to share as well.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="onboard-name">Clinic name</Label>
          <Input required minLength={2} maxLength={120} {...field('name')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboard-email">Admin email</Label>
          <Input type="email" required autoComplete="off" {...field('email')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboard-phone">Phone (optional)</Label>
          <Input type="tel" maxLength={30} {...field('phone')} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="onboard-address">Address (optional)</Label>
          <Input maxLength={300} {...field('address')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboard-city">City</Label>
          <Input maxLength={100} {...field('city')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboard-state">State</Label>
          <Input maxLength={100} {...field('state')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboard-zipCode">ZIP / PIN code</Label>
          <Input maxLength={20} {...field('zipCode')} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="onboard-latitude">Latitude</Label>
            <Input inputMode="decimal" placeholder="Optional" {...field('latitude')} aria-invalid={Boolean(coordError) || undefined} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="onboard-longitude">Longitude</Label>
            <Input inputMode="decimal" placeholder="Optional" {...field('longitude')} aria-invalid={Boolean(coordError) || undefined} />
          </div>
        </div>
        {coordError && (
          <p className="text-sm text-destructive sm:col-span-2" role="alert">
            {coordError}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="onboard-timezone">Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="onboard-timezone" className="w-full">
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboard-plan">Plan</Label>
          <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
            <SelectTrigger id="onboard-plan" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PLAN_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending || Boolean(coordError)}>
          {create.isPending && <Loader2 className="animate-spin" />}
          Create &amp; invite
        </Button>
      </DialogFooter>
    </form>
  );
}
