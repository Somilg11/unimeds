'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/lib/api';
import type { Appointment } from '@/lib/types';
import { formatDateTime, formatTime, isBrowserZone, zoneLabel } from '@/lib/format';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ErrorState, ListSkeleton, StatusBadge } from '@/components/app/common';
import { AppointmentActions } from './appointment-actions';
import { clinicKeys } from './hooks';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Detail({ a }: { a: Appointment }) {
  const tz = a.clinic.timezone;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={a.status} />
        {!isBrowserZone(tz) && <span className="text-xs text-muted-foreground">Times in {zoneLabel(tz)}</span>}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="When">
          {formatDateTime(a.startsAt, tz)} – {formatTime(a.endsAt, tz)}
        </Field>
        <Field label="Doctor">
          {a.doctor.name}
          {a.doctor.specialization && <span className="block text-xs text-muted-foreground">{a.doctor.specialization}</span>}
        </Field>
        <Field label="Patient">
          <Link href={`/clinic/patients/${a.patient.id}`} className="font-medium underline-offset-4 hover:underline">
            {a.patient.name}
          </Link>
          <span className="block text-xs text-muted-foreground">{a.patient.email}</span>
        </Field>
        <Field label="Booked">{formatDateTime(a.createdAt, tz)}</Field>
        {a.reason && (
          <div className="sm:col-span-2">
            <Field label="Reason for visit">{a.reason}</Field>
          </div>
        )}
      </dl>

      {a.status === 'reschedule_proposed' && a.proposedStartsAt && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-500/30 dark:bg-sky-500/10">
          <p className="font-medium">Proposed: {formatDateTime(a.proposedStartsAt, tz)}</p>
          {a.rescheduleReason && <p className="mt-1 text-muted-foreground">{a.rescheduleReason}</p>}
          <p className="mt-1 text-xs text-muted-foreground">Waiting for the patient to accept or decline.</p>
        </div>
      )}
      {a.status === 'cancelled' && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">Cancelled{a.cancelledBy === a.patient.id ? ' by the patient' : ''}</p>
          {a.cancellationReason && <p className="mt-1 text-muted-foreground">{a.cancellationReason}</p>}
        </div>
      )}
      {a.completedAt && (
        <dl>
          <Field label="Completed">{formatDateTime(a.completedAt, tz)}</Field>
        </dl>
      )}

      <Separator />
      <AppointmentActions appointment={a} />
    </div>
  );
}

/** Right-hand drawer showing one appointment (GET /clinic/appointments/:id). */
export function AppointmentSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: clinicKeys.appointment(id ?? ''),
    queryFn: () => api.get<{ appointment: Appointment }>(`/clinic/appointments/${id}`),
    enabled: Boolean(id),
  });

  return (
    <Sheet open={Boolean(id)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Appointment</SheetTitle>
          <SheetDescription>{data ? `${data.appointment.patient.name} · ${data.appointment.doctor.name}` : 'Details and actions'}</SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          {isLoading ? (
            <ListSkeleton rows={3} />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
          ) : data ? (
            <Detail a={data.appointment} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
