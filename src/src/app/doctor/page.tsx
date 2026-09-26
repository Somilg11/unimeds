'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, CalendarDays, CircleCheck, Clock, Inbox, Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime, formatTime, formatWeekday, relativeTime } from '@/lib/format';
import type { Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatCard, StatusBadge } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { availableActions, CancelButton, CompleteDialog, ConfirmButton, NoShowButton } from './_components/appointment-actions';
import { ZoneHint } from './_components/bits';
import { useNow } from './_components/hooks';

type Overview = {
  clinics: Array<{ id: string; name: string; timezone: string }>;
  timezone: string;
  today: Appointment[];
  needsAction: Appointment[];
  stats: { pending: number; upcomingWeek: number; completedMonth: number; patients: number };
};

export default function DoctorTodayPage() {
  const now = useNow();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor', 'overview'],
    queryFn: () => api.get<Overview>('/doctor/overview'),
    refetchInterval: 60_000,
  });

  const multiClinic = (data?.clinics.length ?? 0) > 1;

  return (
    <>
      <PageHeader
        title="Today"
        description={data ? formatWeekday(new Date(now), data.timezone) : undefined}
        actions={
          <Button variant="outline" asChild>
            <Link href="/doctor/appointments">
              <CalendarDays /> All appointments
            </Link>
          </Button>
        }
      />

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-10">
          <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {isLoading || !data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : (
              <>
                <StatCard label="Awaiting confirmation" value={data.stats.pending} icon={Inbox} />
                <StatCard label="Next 7 days" value={data.stats.upcomingWeek} icon={CalendarCheck} />
                <StatCard label="Completed (30 days)" value={data.stats.completedMonth} icon={CircleCheck} />
                <StatCard label="Patients" value={data.stats.patients} icon={Users} />
              </>
            )}
          </section>

          <div className="grid gap-10 xl:grid-cols-5">
            <section className="xl:col-span-3" aria-labelledby="agenda-title">
              <h2 id="agenda-title" className="mb-4 text-lg font-semibold">
                Today&apos;s agenda
              </h2>
              {isLoading || !data ? (
                <ListSkeleton />
              ) : data.today.length === 0 ? (
                <EmptyState icon={Clock} title="No visits today" description="Enjoy the quiet — new bookings will show up here." />
              ) : (
                <ol className="relative space-y-3 border-l pl-6">
                  {data.today.map((a) => (
                    <AgendaItem key={a.id} appt={a} now={now} showClinic={multiClinic} />
                  ))}
                </ol>
              )}
            </section>

            <section className="xl:col-span-2" aria-labelledby="needs-title">
              <h2 id="needs-title" className="mb-4 text-lg font-semibold">
                Needs confirmation
              </h2>
              {isLoading || !data ? (
                <ListSkeleton rows={3} />
              ) : data.needsAction.length === 0 ? (
                <EmptyState icon={Inbox} title="All caught up" description="No booking requests are waiting for you." />
              ) : (
                <ul className="space-y-3">
                  {data.needsAction.map((a) => (
                    <li key={a.id} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/doctor/appointments/${a.id}`} className="font-medium hover:underline">
                            {a.patient.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(a.startsAt, a.clinic.timezone)}
                            <ZoneHint timezone={a.clinic.timezone} />
                            {multiClinic && ` · ${a.clinic.name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">Requested {relativeTime(a.createdAt)}</p>
                        </div>
                      </div>
                      {a.reason && <p className="mt-2 line-clamp-2 text-sm">&ldquo;{a.reason}&rdquo;</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ConfirmButton appt={a} />
                        <CancelButton appt={a} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}

function AgendaItem({ appt: a, now, showClinic }: { appt: Appointment; now: number; showClinic: boolean }) {
  const acts = availableActions(a, now);
  const start = new Date(a.startsAt).getTime();
  const end = new Date(a.endsAt).getTime();
  const current = now >= start && now < end && (a.status === 'confirmed' || a.status === 'pending');
  const done = a.status === 'completed' || a.status === 'no_show';

  return (
    <li className="relative">
      <span
        aria-hidden
        className={cn(
          'absolute top-5 -left-[31px] size-3 rounded-full border-2 border-background',
          current ? 'bg-primary ring-4 ring-primary/20' : done ? 'bg-muted-foreground/40' : 'bg-primary/60'
        )}
      />
      <div className={cn('rounded-xl border bg-card p-4', current && 'border-primary/50', done && 'opacity-80')}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium tabular-nums">
              {formatTime(a.startsAt, a.clinic.timezone)} – {formatTime(a.endsAt, a.clinic.timezone)}
              <ZoneHint timezone={a.clinic.timezone} />
              {current && <span className="ml-2 text-xs font-semibold text-primary">Now</span>}
            </p>
            <Link href={`/doctor/appointments/${a.id}`} className="font-semibold hover:underline">
              {a.patient.name}
            </Link>
            {showClinic && <p className="text-xs text-muted-foreground">{a.clinic.name}</p>}
          </div>
          <StatusBadge status={a.status} />
        </div>
        {a.reason && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.reason}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/doctor/appointments/${a.id}`}>Open</Link>
          </Button>
          {acts.confirm && <ConfirmButton appt={a} />}
          {acts.complete && <CompleteDialog appt={a} tooEarly={acts.completeTooEarly} />}
          {acts.noShow && <NoShowButton appt={a} />}
        </div>
      </div>
    </li>
  );
}
