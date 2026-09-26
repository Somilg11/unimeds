'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Stethoscope } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import type { Appointment, Slot } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/app/common';
import { SlotPicker } from '@/components/app/slot-picker';
import { useClinic, useTeam } from '../../_components/hooks';

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-3 font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">{n}</span>
        {title}
      </h2>
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

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/clinic/appointments">
          <ArrowLeft /> Appointments
        </Link>
      </Button>
      <PageHeader title="New booking" description="Book a phone or walk-in patient. Front-desk bookings are confirmed immediately." />

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
          <Step n={1} title="Doctor">
            <div className="space-y-1.5">
              <Label htmlFor="nb-doctor">Doctor</Label>
              <Select
                value={doctorId}
                onValueChange={(v) => {
                  setDoctorId(v);
                  setSlot(null);
                }}
              >
                <SelectTrigger id="nb-doctor" className="w-full sm:w-80">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>
                      {m.user.name}
                      {m.user.specialization ? ` · ${m.user.specialization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Step>

          <Step n={2} title="Date and time">
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
              <p className="text-sm text-muted-foreground">Choose a doctor to see free times.</p>
            )}
          </Step>

          <Step n={3} title="Patient">
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
                  aria-describedby="nb-email-help"
                />
                <p id="nb-email-help" className={emailError ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                  {emailError ?? 'If the patient has no Unimeds account yet, one is created for this email.'}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nb-name">Full name</Label>
                <Input id="nb-name" required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nb-phone">Phone (optional)</Label>
                <Input id="nb-phone" type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nb-reason">Reason for visit (optional)</Label>
                <Textarea id="nb-reason" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>
          </Step>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            {slot && <p className="text-sm text-muted-foreground sm:mr-auto">Selected: {formatDateTime(slot.startsAt, tz)}</p>}
            <Button type="submit" size="lg" disabled={!canSubmit}>
              {book.isPending && <Loader2 className="animate-spin" />}
              Book appointment
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
