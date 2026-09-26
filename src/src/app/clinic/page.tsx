'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, CalendarDays, CalendarPlus, Clock, Stethoscope, UserRound } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Appointment } from '@/lib/types';
import { formatWeekday, isBrowserZone, zoneLabel } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatCard } from '@/components/app/common';
import { AppointmentRow } from './_components/appointment-row';
import { AppointmentSheet } from './_components/appointment-sheet';
import { clinicKeys } from './_components/hooks';
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

export default function ClinicOverviewPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: clinicKeys.overview,
    queryFn: () => api.get<ClinicOverview>('/clinic/overview'),
    refetchInterval: 60_000,
  });

  const tz = data?.clinic.timezone;
  const newBooking = (
    <Button asChild>
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
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Next 7 days" value={data.stats.next7Days} icon={CalendarDays} hint="Pending and confirmed" />
            <StatCard label="Awaiting confirmation" value={data.stats.pending} icon={Clock} />
            <StatCard label="Patients" value={data.stats.patients} icon={UserRound} hint="All time" />
            <StatCard label="Completed" value={data.stats.completed30d} icon={CalendarCheck} hint="Last 30 days" />
            <StatCard label="Active doctors" value={data.stats.doctors} icon={Stethoscope} />
          </div>

          <section aria-labelledby="pending-heading" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 id="pending-heading" className="text-lg font-semibold">
                Awaiting confirmation
              </h2>
              {data.stats.pending > data.pending.length && (
                <Button asChild variant="link" size="sm">
                  <Link href="/clinic/appointments?status=pending">View all {data.stats.pending}</Link>
                </Button>
              )}
            </div>
            {data.pending.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="Nothing to confirm" description="New booking requests will appear here." />
            ) : (
              <ul className="space-y-3">
                {data.pending.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} onOpen={setOpenId} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="today-heading" className="space-y-4">
            <h2 id="today-heading" className="text-lg font-semibold">
              Today&apos;s schedule
            </h2>
            {data.today.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No appointments today" action={newBooking} />
            ) : (
              <div className="space-y-6">
                {groupByDoctor(data.today).map((g) => (
                  <div key={g.doctor.id} className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {g.doctor.name}
                      {g.doctor.specialization && ` · ${g.doctor.specialization}`}
                      <span className="ml-2 text-xs">({g.items.length})</span>
                    </h3>
                    <ul className="space-y-3">
                      {g.items.map((a) => (
                        <AppointmentRow key={a.id} appointment={a} onOpen={setOpenId} showDate={false} showDoctor={false} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <AppointmentSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
