'use client';

import { CalendarDays, Clock } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/format';
import { StatusBadge } from '@/components/app/common';
import { AppointmentActions } from './appointment-actions';
import { PersonAvatar, TimePill } from './panel';

/**
 * One appointment line for use inside a white Panel list (`<ul className="divide-y">`):
 * patient avatar, name, doctor/reason, date + time pills, status and (optionally) actions.
 */
export function AppointmentRow({
  appointment: a,
  onOpen,
  showDate = true,
  showDoctor = true,
  actions = true,
  actionMode = 'full',
}: {
  appointment: Appointment;
  onOpen?: (id: string) => void;
  showDate?: boolean;
  showDoctor?: boolean;
  actions?: boolean;
  actionMode?: 'full' | 'decision';
}) {
  const tz = a.clinic.timezone;
  // In the confirm/decline queue every row is pending, so the status pill adds nothing
  const showStatus = actionMode !== 'decision';
  return (
    <li className="space-y-3 py-4 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => onOpen?.(a.id)}
        disabled={!onOpen}
        className="-m-1 flex w-[calc(100%+0.5rem)] min-w-0 items-center gap-3 rounded-2xl p-1 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-default disabled:hover:bg-transparent"
        aria-label={onOpen ? `Open appointment for ${a.patient.name}` : undefined}
      >
        <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{a.patient.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {showDoctor ? a.doctor.name : a.patient.email}
            {a.reason && ` · ${a.reason}`}
          </p>
        </div>
        {showStatus && <StatusBadge status={a.status} className="shrink-0" />}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2 pl-[3.25rem]">
        <div className="flex flex-wrap items-center gap-2">
          {showDate && (
            <TimePill>
              <CalendarDays className="size-3.5 text-muted-foreground" aria-hidden /> {formatDate(a.startsAt, tz)}
            </TimePill>
          )}
          <TimePill>
            <Clock className="size-3.5 text-muted-foreground" aria-hidden /> {formatTime(a.startsAt, tz)}
          </TimePill>
        </div>
        {actions && <AppointmentActions appointment={a} mode={actionMode} />}
      </div>
    </li>
  );
}
