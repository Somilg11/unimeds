'use client';

import type { Appointment } from '@/lib/types';
import { formatDate, formatTime, initials } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/app/common';
import { AppointmentActions } from './appointment-actions';

/** One appointment line: time, patient, doctor, status, and (optionally) inline actions. */
export function AppointmentRow({
  appointment: a,
  onOpen,
  showDate = true,
  showDoctor = true,
  actions = true,
}: {
  appointment: Appointment;
  onOpen?: (id: string) => void;
  showDate?: boolean;
  showDoctor?: boolean;
  actions?: boolean;
}) {
  const tz = a.clinic.timezone;
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => onOpen?.(a.id)}
        disabled={!onOpen}
        className="flex min-w-0 flex-1 items-center gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg disabled:cursor-default"
        aria-label={onOpen ? `Open appointment for ${a.patient.name}` : undefined}
      >
        <div className="w-20 shrink-0">
          <p className="text-sm font-semibold">{formatTime(a.startsAt, tz)}</p>
          {showDate && <p className="text-xs text-muted-foreground">{formatDate(a.startsAt, tz)}</p>}
        </div>
        <Avatar className="size-9 shrink-0">
          {a.patient.avatarUrl && <AvatarImage src={a.patient.avatarUrl} alt="" />}
          <AvatarFallback>{initials(a.patient.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{a.patient.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {showDoctor ? a.doctor.name : a.patient.email}
            {a.reason && ` · ${a.reason}`}
          </p>
        </div>
        <StatusBadge status={a.status} className="shrink-0" />
      </button>
      {actions && (
        <div className="sm:shrink-0">
          <AppointmentActions appointment={a} />
        </div>
      )}
    </li>
  );
}
