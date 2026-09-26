'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CalendarDays, CalendarPlus, CheckCircle2, Clock, FileText, Stethoscope, XCircle, type LucideIcon } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Appointment } from '@/lib/types';
import { formatDate, formatDateTime, formatTime, isBrowserZone, zoneLabel } from '@/lib/format';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ErrorState, ListSkeleton, StatusBadge } from '@/components/app/common';
import { AppointmentActions } from './appointment-actions';
import { clinicKeys } from './hooks';
import { IconCircle, PersonAvatar } from './panel';

/** Info tile: icon circle, muted label, value. */
function Tile({ icon, label, children, className }: { icon: LucideIcon; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl bg-muted/60 p-3.5 ${className ?? ''}`}>
      <IconCircle icon={icon} className="size-9 bg-card" />
      <div className="min-w-0 space-y-0.5">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium break-words">{children}</dd>
      </div>
    </div>
  );
}

function Detail({ a }: { a: Appointment }) {
  const tz = a.clinic.timezone;
  return (
    <div className="space-y-6">
      {/* Patient header */}
      <div className="flex items-center gap-4 rounded-3xl bg-muted/60 p-4">
        <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} className="size-14 text-lg" />
        <div className="min-w-0 flex-1">
          <Link href={`/clinic/patients/${a.patient.id}`} className="block truncate text-lg font-semibold underline-offset-4 hover:underline">
            {a.patient.name}
          </Link>
          <p className="truncate text-sm text-muted-foreground">{a.patient.email}</p>
        </div>
        <StatusBadge status={a.status} className="shrink-0" />
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Tile icon={CalendarDays} label="Date">
          {formatDate(a.startsAt, tz)}
        </Tile>
        <Tile icon={Clock} label="Time">
          <span className="tabular-nums">
            {formatTime(a.startsAt, tz)} – {formatTime(a.endsAt, tz)}
          </span>
          {!isBrowserZone(tz) && <span className="block text-xs font-normal text-muted-foreground">{zoneLabel(tz)}</span>}
        </Tile>
        <Tile icon={Stethoscope} label="Doctor">
          {a.doctor.name}
          {a.doctor.specialization && <span className="block text-xs font-normal text-muted-foreground">{a.doctor.specialization}</span>}
        </Tile>
        <Tile icon={CalendarPlus} label="Booked">
          {formatDateTime(a.createdAt, tz)}
        </Tile>
        {a.reason && (
          <Tile icon={FileText} label="Reason for visit" className="sm:col-span-2">
            <span className="font-normal">{a.reason}</span>
          </Tile>
        )}
        {a.completedAt && (
          <Tile icon={CheckCircle2} label="Completed" className="sm:col-span-2">
            {formatDateTime(a.completedAt, tz)}
          </Tile>
        )}
      </dl>

      {a.status === 'reschedule_proposed' && a.proposedStartsAt && (
        <div className="flex gap-3 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Proposed: {formatDateTime(a.proposedStartsAt, tz)}</p>
            {a.rescheduleReason && <p className="mt-1 text-foreground">{a.rescheduleReason}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Waiting for the patient to accept or decline.</p>
          </div>
        </div>
      )}
      {a.status === 'cancelled' && (
        <div className="flex gap-3 rounded-2xl bg-muted p-4 text-sm">
          <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-semibold">Cancelled{a.cancelledBy === a.patient.id ? ' by the patient' : ''}</p>
            {a.cancellationReason && <p className="mt-1 text-muted-foreground">{a.cancellationReason}</p>}
          </div>
        </div>
      )}

      <div className="border-t pt-5">
        <AppointmentActions appointment={a} size="default" />
      </div>
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
          <SheetTitle className="text-xl font-bold tracking-tight">Appointment</SheetTitle>
          <SheetDescription>{data ? `With ${data.appointment.doctor.name}` : 'Details and actions'}</SheetDescription>
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
