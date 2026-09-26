'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, CalendarDays, CalendarPlus, ChevronRight, Clock, Stethoscope, UserRound } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Appointment } from '@/lib/types';
import { formatTime, formatWeekday, isBrowserZone, zoneLabel } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatCard, StatusBadge } from '@/components/app/common';
import { AppointmentRow } from './_components/appointment-row';
import { AppointmentSheet } from './_components/appointment-sheet';
import { clinicKeys } from './_components/hooks';
import { CountChip, Panel, PersonAvatar } from './_components/panel';
import type { ClinicOverview } from './_components/types';

function groupByDoctor(list: Appointment[]) {
  const groups = new Map<string, { doctor: Appointment['doctor']; items: Appointment[] }>();
  for (const a of list) {
    const g = groups.get(a.doctor.id) ?? { doctor: a.doctor, items: [] };
    g.items.push(a);
    groups.set(a.doctor.id, g);
  }
  return [...groups.values()];
}

/** One doctor's day: avatar header, then time pills with the patient for each visit. */
function DoctorDay({ doctor, items, onOpen }: { doctor: Appointment['doctor']; items: Appointment[]; onOpen: (id: string) => void }) {
  return (
    <div className="rounded-3xl bg-muted/50 p-4">
      <div className="mb-3 flex items-center gap-3">
        <PersonAvatar name={doctor.name} src={doctor.avatarUrl} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{doctor.name}</p>
          <p className="truncate text-xs text-muted-foreground">{doctor.specialization ?? 'Doctor'}</p>
        </div>
        <span className="rounded-full bg-card px-2.5 py-1 text-xs font-medium tabular-nums">
          {items.length} {items.length === 1 ? 'visit' : 'visits'}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onOpen(a.id)}
              aria-label={`Open appointment for ${a.patient.name} at ${formatTime(a.startsAt, a.clinic.timezone)}`}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-2 pr-3 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <span className="inline-flex h-9 w-20 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                {formatTime(a.startsAt, a.clinic.timezone)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{a.patient.name}</span>
                {a.reason && <span className="block truncate text-xs text-muted-foreground">{a.reason}</span>}
              </span>
              <StatusBadge status={a.status} compact className="shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ClinicOverviewPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: clinicKeys.overview,
    queryFn: () => api.get<ClinicOverview>('/clinic/overview'),
    refetchInterval: 60_000,
  });

  const tz = data?.clinic.timezone;
  const newBooking = (
    <Button asChild size="lg">
      <Link href="/clinic/appointments/new">
        <CalendarPlus /> New booking
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Overview"
        description={tz ? `${formatWeekday(new Date(), tz)}${isBrowserZone(tz) ? '' : ` · clinic time (${zoneLabel(tz)})`}` : undefined}
        actions={newBooking}
      />

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : error || !data ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Next 7 days" value={data.stats.next7Days} icon={CalendarDays} hint="Pending and confirmed" highlight />
            <StatCard label="Awaiting confirmation" value={data.stats.pending} icon={Clock} hint="Needs a reply" />
            <StatCard label="Patients" value={data.stats.patients} icon={UserRound} hint="All time" />
            <StatCard label="Completed" value={data.stats.completed30d} icon={CalendarCheck} hint="Last 30 days" />
            <StatCard label="Active doctors" value={data.stats.doctors} icon={Stethoscope} hint="On the team" />
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Panel
              id="pending-heading"
              title={
                <>
                  Awaiting confirmation
                  <CountChip>{data.stats.pending}</CountChip>
                </>
              }
              description="New booking requests from patients"
              actions={
                data.stats.pending > data.pending.length ? (
                  <Link href="/clinic/appointments?status=pending" className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline">
                    View all <ChevronRight className="size-4" />
                  </Link>
                ) : undefined
              }
            >
              {data.pending.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <CalendarCheck className="size-5" />
                  </span>
                  <p className="font-semibold">Nothing to confirm</p>
                  <p className="mt-1 text-sm text-muted-foreground">New booking requests will appear here.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {data.pending.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} onOpen={setOpenId} actionMode="decision" />
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              id="today-heading"
              title={
                <>
                  Today
                  <CountChip>{data.today.length}</CountChip>
                </>
              }
              description="Schedule by doctor"
              actions={
                <Link href="/clinic/appointments" className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline">
                  All appointments <ChevronRight className="size-4" />
                </Link>
              }
            >
              {data.today.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No appointments today" description="Walk-ins and phone bookings can be added any time." />
              ) : (
                <div className="space-y-3">
                  {groupByDoctor(data.today).map((g) => (
                    <DoctorDay key={g.doctor.id} doctor={g.doctor} items={g.items} onOpen={setOpenId} />
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      <AppointmentSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
