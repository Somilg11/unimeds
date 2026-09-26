'use client';

import type { Appointment } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/common';
import { AppointmentActions } from './appointment-actions';
import { PersonAvatar, TimePill } from './panel';

/** Appointments as a shadcn Table (desktop). The whole row opens the detail sheet; actions sit above the row link. */
export function AppointmentTable({
  items,
  onOpen,
  actions = true,
  showDoctor = true,
}: {
  items: Appointment[];
  onOpen: (id: string) => void;
  actions?: boolean;
  showDoctor?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-11 pl-0 text-xs font-medium text-muted-foreground">Patient</TableHead>
          {showDoctor && <TableHead className="hidden h-11 text-xs font-medium text-muted-foreground lg:table-cell">Doctor</TableHead>}
          <TableHead className="h-11 text-xs font-medium text-muted-foreground">Date &amp; time</TableHead>
          <TableHead className="h-11 text-xs font-medium text-muted-foreground">Status</TableHead>
          {actions && (
            <TableHead className="h-11 pr-0 text-right text-xs font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((a) => {
          const tz = a.clinic.timezone;
          return (
            <TableRow key={a.id} className="relative">
              <TableCell className="py-3 pl-0">
                <button
                  type="button"
                  onClick={() => onOpen(a.id)}
                  className="flex min-w-0 items-center gap-3 text-left outline-none after:absolute after:inset-0 focus-visible:after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/40"
                  aria-label={`Open appointment for ${a.patient.name}`}
                >
                  <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} />
                  <span className="min-w-0">
                    <span className="block max-w-56 truncate font-semibold">{a.patient.name}</span>
                    <span className="block max-w-56 truncate text-xs text-muted-foreground">{a.reason || a.patient.email}</span>
                  </span>
                </button>
              </TableCell>
              {showDoctor && (
                <TableCell className="hidden py-3 lg:table-cell">
                  <span className="flex items-center gap-2.5">
                    <PersonAvatar name={a.doctor.name} src={a.doctor.avatarUrl} className="size-8 text-xs" />
                    <span className="min-w-0">
                      <span className="block max-w-44 truncate font-medium">{a.doctor.name}</span>
                      {a.doctor.specialization && <span className="block max-w-44 truncate text-xs text-muted-foreground">{a.doctor.specialization}</span>}
                    </span>
                  </span>
                </TableCell>
              )}
              <TableCell className="py-3">
                <span className="flex flex-wrap gap-1.5">
                  <TimePill>{formatDate(a.startsAt, tz)}</TimePill>
                  <TimePill className="bg-accent text-accent-foreground">{formatTime(a.startsAt, tz)}</TimePill>
                </span>
              </TableCell>
              <TableCell className="py-3">
                <StatusBadge status={a.status} />
              </TableCell>
              {actions && (
                <TableCell className="relative z-10 py-3 pr-0">
                  <div className="flex justify-end">
                    <AppointmentActions appointment={a} size="xs" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
