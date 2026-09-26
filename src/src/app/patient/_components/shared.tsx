'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Check, ChevronRight, Loader2, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, formatTime, formatWeekday, isBrowserZone, zoneLabel } from '@/lib/format';
import type { Appointment, Me, Paged } from '@/lib/types';
import { StatusBadge } from '@/components/app/common';
import { Button } from '@/components/ui/button';

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

/** Compact appointment row linking to its detail page. */
export function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const tz = a.clinic.timezone;
  const { day, time } = apptDayTime(a.startsAt, tz);
  return (
    <Link
      href={`/patient/appointments/${a.id}`}
      className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{a.doctor.name}</p>
          <StatusBadge status={a.status} />
        </div>
        <p className="text-sm">
          {day} · {time}
        </p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" />
          {a.clinic.name}
          {a.doctor.specialization && ` · ${a.doctor.specialization}`}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
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
