'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, Check, Clock, Loader2, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, formatTime, formatWeekday, initials, isBrowserZone, zoneLabel } from '@/lib/format';
import type { Appointment, Me, Paged } from '@/lib/types';
import { StatusBadge } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Query key roots for the patient portal. Invalidating `['patient']` refreshes everything below it. */
export const PK = {
  all: ['patient'] as const,
  overview: ['patient', 'overview'] as const,
  appointments: (params: Record<string, unknown>) => ['patient', 'appointments', params] as const,
  appointment: (id: string) => ['patient', 'appointment', id] as const,
  records: (params: Record<string, unknown>) => ['patient', 'records', params] as const,
  me: ['patient', 'me'] as const,
};

export function useMe() {
  return useQuery({ queryKey: PK.me, queryFn: () => api.get<{ user: Me }>('/auth/me').then((r) => r.user) });
}

/** Zone suffix such as " IST", only when the clinic zone differs from the viewer's. */
export function zoneSuffix(timeZone: string, at?: string | Date) {
  return isBrowserZone(timeZone) ? '' : ` ${zoneLabel(timeZone, at ? new Date(at) : undefined)}`;
}

/** "12 Oct 2026, 9:30 am IST" in the clinic's timezone. */
export function apptTime(iso: string, timeZone: string) {
  return `${formatDateTime(iso, timeZone)}${zoneSuffix(timeZone, iso)}`;
}

export function apptDayTime(iso: string, timeZone: string) {
  return { day: formatWeekday(iso, timeZone), time: `${formatTime(iso, timeZone)}${zoneSuffix(timeZone, iso)}`, date: formatDate(iso, timeZone) };
}

export const apptLabel = (a: Appointment) => `${a.doctor.name} · ${a.clinic.name} · ${apptTime(a.startsAt, a.clinic.timezone)}`;

/** Accept / decline a clinic's proposed new time. */
export function RespondButtons({ appointment, size = 'sm' }: { appointment: Appointment; size?: 'sm' | 'default' }) {
  const qc = useQueryClient();
  const respond = useMutation({
    mutationFn: (accept: boolean) => api.post<{ appointment: Appointment }>(`/patient/appointments/${appointment.id}/respond`, { accept }),
    onSuccess: (_d, accept) => {
      toast.success(accept ? 'New time accepted — your visit is confirmed' : 'Proposal declined — the visit was cancelled');
      void qc.invalidateQueries({ queryKey: PK.all });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const busy = respond.isPending;
  return (
    <div className="flex flex-wrap gap-2">
      <Button size={size} disabled={busy} onClick={() => respond.mutate(true)}>
        {busy && respond.variables === true ? <Loader2 className="animate-spin" /> : <Check />}
        Accept new time
      </Button>
      <Button size={size} variant="outline" disabled={busy} onClick={() => respond.mutate(false)}>
        {busy && respond.variables === false ? <Loader2 className="animate-spin" /> : <X />}
        Decline
      </Button>
    </div>
  );
}

/** Appointment card: doctor, status, then date and time chips (mobile-first). */
export function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const tz = a.clinic.timezone;
  const { date, time } = apptDayTime(a.startsAt, tz);
  return (
    <Link
      href={`/patient/appointments/${a.id}`}
      className="block rounded-3xl bg-card p-4 transition-colors hover:bg-card/70 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          {a.doctor.avatarUrl && <AvatarImage src={a.doctor.avatarUrl} alt="" />}
          <AvatarFallback className="bg-accent font-semibold text-accent-foreground">{initials(a.doctor.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{a.doctor.name}</p>
          <p className="truncate text-sm text-muted-foreground">{a.doctor.specialization ?? a.clinic.name}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="size-4 text-muted-foreground" />
          </span>
          <span className="leading-tight">
            <span className="block text-xs text-muted-foreground">Date</span>
            <span className="font-medium">{date}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted">
            <Clock className="size-4 text-muted-foreground" />
          </span>
          <span className="leading-tight">
            <span className="block text-xs text-muted-foreground">Time</span>
            <span className="font-medium">{time}</span>
          </span>
        </span>
      </div>
    </Link>
  );
}

/**
 * Appointments a document can be shared with: upcoming visits plus recent past ones
 * (cancelled / no-show visits are excluded).
 */
export function useShareableAppointments() {
  const upcoming = useQuery({
    queryKey: PK.appointments({ scope: 'upcoming', page: 1, pageSize: 50 }),
    queryFn: () => api.get<Paged<Appointment>>('/patient/appointments', { scope: 'upcoming', page: 1, pageSize: 50 }),
  });
  const past = useQuery({
    queryKey: PK.appointments({ scope: 'past', page: 1, pageSize: 20 }),
    queryFn: () => api.get<Paged<Appointment>>('/patient/appointments', { scope: 'past', page: 1, pageSize: 20 }),
  });
  const list = [...(upcoming.data?.items ?? []), ...(past.data?.items ?? [])].filter((a) => a.status !== 'cancelled' && a.status !== 'no_show');
  return list.map((a) => ({ id: a.id, label: apptLabel(a) }));
}

/** Returns `value` once it has stopped changing for `ms`. */
export function useDebounced<T>(value: T, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
