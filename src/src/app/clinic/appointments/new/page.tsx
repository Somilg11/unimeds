'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CalendarDays, Check, Loader2, Stethoscope } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import type { Appointment, Slot } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/app/common';
import { SlotPicker } from '@/components/app/slot-picker';
import { useClinic, useTeam } from '../../_components/hooks';
import { PersonAvatar } from '../../_components/panel';

function Step({ n, title, description, children }: { n: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-5 sm:p-6" aria-labelledby={`step-${n}`}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{n}</span>
        <div className="min-w-0">
          <h2 id={`step-${n}`} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function NewBookingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const clinic = useClinic();
  const team = useTeam();

  const [doctorId, setDoctorId] = useState('');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slotKey, setSlotKey] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const doctors = (team.data?.members ?? []).filter((m) => m.role === 'doctor' && m.isActive);
  const tz = clinic.data?.timezone ?? 'UTC';

  const book = useMutation({
    mutationFn: () =>
      api.post<{ appointment: Appointment }>('/clinic/appointments', {
        doctorId,
        startsAt: slot!.startsAt,
        reason: reason.trim() || undefined,
        patient: { email: email.trim(), name: name.trim(), phone: phone.trim() || undefined },
      }),
    onSuccess: ({ appointment }) => {
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'clinic' && q.queryKey[1] !== 'profile' });
      qc.invalidateQueries({ queryKey: ['slots'] });
      toast.success(`Booked ${appointment.patient.name} for ${formatDateTime(appointment.startsAt, appointment.clinic.timezone)}`);
      router.push(`/clinic/appointments?focus=${appointment.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'SLOT_UNAVAILABLE') {
        toast.error('That time was just taken. Please pick another slot.');
        setSlot(null);
        setSlotKey((k) => k + 1);
        qc.invalidateQueries({ queryKey: ['slots'] });
        return;
      }
      if (err instanceof ApiError && err.code === 'NOT_A_PATIENT') {
        setEmailError('This email belongs to a staff account. Use the patient’s personal email.');
        return;
      }
      toast.error(errorMessage(err));
    },
  });

  const canSubmit = Boolean(doctorId && slot && email.trim() && name.trim().length >= 2) && !book.isPending;

  if (clinic.isLoading || team.isLoading) return <ListSkeleton rows={4} />;
  if (clinic.error || team.error) {
    return <ErrorState message={errorMessage(clinic.error ?? team.error)} onRetry={() => (clinic.refetch(), team.refetch())} />;
  }

  const doctor = doctors.find((m) => m.user.id === doctorId);

  return (
    <div className="max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/clinic/appointments">
          <ArrowLeft /> Appointments
        </Link>
      </Button>
      <PageHeader title="Make an appointment" description="Book a phone or walk-in patient. Front-desk bookings are confirmed immediately." />

      {doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No active doctors"
          description="Invite a doctor or restore a doctor's access before booking."
          action={
            <Button asChild>
              <Link href="/clinic/team">Go to team</Link>
            </Button>
          }
        />
      ) : (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) book.mutate();
          }}
        >
          <Step n={1} title="Choose a doctor" description={`${doctors.length} available at this clinic`}>
            <div role="radiogroup" aria-label="Doctor" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((m) => {
                const selected = m.user.id === doctorId;
                return (
                  <button
                    key={m.user.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      if (selected) return;
                      setDoctorId(m.user.id);
                      setSlot(null);
                    }}
                    className={cn(
                      'relative flex items-center gap-3 rounded-3xl border-2 p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40',
                      selected ? 'border-primary bg-accent' : 'border-transparent bg-muted/60 hover:bg-muted'
                    )}
                  >
                    <PersonAvatar name={m.user.name} src={m.user.avatarUrl} className={cn('size-12', selected && '[&_[data-slot=avatar-fallback]]:bg-card')} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{m.user.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{m.user.specialization ?? 'Doctor'}</span>
                      <span className="mt-1 block text-xs text-muted-foreground tabular-nums">{m.upcoming} upcoming</span>
                    </span>
                    {selected && (
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Step>

          <Step n={2} title="Date and time" description={doctor ? `Free times for ${doctor.user.name}` : undefined}>
            {doctorId && clinic.data ? (
              <SlotPicker
                key={`${doctorId}-${slotKey}`}
                doctorId={doctorId}
                clinicId={clinic.data.id}
                timezone={tz}
                value={slot?.startsAt ?? null}
                onChange={setSlot}
                days={Math.min(clinic.data.settings.bookingWindowDays, 30)}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" aria-hidden /> Choose a doctor to see free times.
              </div>
            )}
          </Step>

          <Step n={3} title="Patient details" description="If the patient has no Unimeds account yet, one is created for this email.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nb-email">Email</Label>
                <Input
                  id="nb-email"
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'nb-email-help' : undefined}
                  className="h-11 px-4"
                />
                {emailError && (
                  <p id="nb-email-help" className="text-xs text-destructive">
                    {emailError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nb-name">Full name</Label>
                <Input id="nb-name" required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className="h-11 px-4" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nb-phone">Phone (optional)</Label>
                <Input id="nb-phone" type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 px-4" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nb-reason">Reason for visit (optional)</Label>
                <Textarea id="nb-reason" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-24 px-4 py-3" />
              </div>
            </div>
          </Step>

          <div className="sticky bottom-4 z-10 flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border sm:flex-row sm:items-center sm:p-5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex min-w-0 items-center gap-3">
                {doctor ? (
                  <PersonAvatar name={doctor.user.name} src={doctor.user.avatarUrl} />
                ) : (
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Stethoscope className="size-4" aria-hidden />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Doctor</p>
                  <p className="truncate text-sm font-semibold">{doctor?.user.name ?? 'Not chosen'}</p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">When</p>
                <p className="text-sm font-semibold tabular-nums">{slot ? formatDateTime(slot.startsAt, tz) : 'Pick a time'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Patient</p>
                <p className="max-w-48 truncate text-sm font-semibold">{name.trim() || '—'}</p>
              </div>
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 sm:shrink-0" disabled={!canSubmit}>
              {book.isPending && <Loader2 className="animate-spin" />}
              Book appointment
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
