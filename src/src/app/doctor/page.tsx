'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarCheck, CalendarDays, CircleCheck, Clock, Coffee, Inbox, MapPin, Users, type LucideIcon } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime, formatTime, formatWeekday, relativeTime } from '@/lib/format';
import type { Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, SectionHeader, StatusBadge } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { availableActions, CancelButton, CompleteDialog, ConfirmButton, NoShowButton } from './_components/appointment-actions';
import { PersonAvatar, ZoneHint } from './_components/bits';
import { useNow } from './_components/hooks';

type Overview = {
  clinics: Array<{ id: string; name: string; timezone: string }>;
  timezone: string;
  today: Appointment[];
  needsAction: Appointment[];
  stats: { pending: number; upcomingWeek: number; completedMonth: number; patients: number };
};

const isOpen = (a: Appointment) => a.status === 'pending' || a.status === 'confirmed';
const isCurrent = (a: Appointment, now: number) =>
  isOpen(a) && now >= new Date(a.startsAt).getTime() && now < new Date(a.endsAt).getTime();

/** The visit in progress, otherwise the next open visit still ahead today. */
function pickUpNext(today: Appointment[], now: number) {
  return today.find((a) => isCurrent(a, now)) ?? today.find((a) => isOpen(a) && new Date(a.startsAt).getTime() > now) ?? null;
}

export default function DoctorTodayPage() {
  const now = useNow();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor', 'overview'],
    queryFn: () => api.get<Overview>('/doctor/overview'),
    refetchInterval: 60_000,
  });

  const multiClinic = (data?.clinics.length ?? 0) > 1;
  const upNext = data ? pickUpNext(data.today, now) : null;
  const loading = isLoading || !data;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Today</h1>
          <p className="text-sm text-muted-foreground">{data ? formatWeekday(new Date(now), data.timezone) : ' '}</p>
        </div>
        <Button variant="outline" asChild className="hidden lg:inline-flex">
          <Link href="/doctor/appointments">
            <CalendarDays /> All appointments
          </Link>
        </Button>
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 *:min-w-0 lg:grid-cols-5">
          <section aria-label="Up next" className="lg:col-span-3">
            {loading ? (
              <Skeleton className="h-60 rounded-3xl" />
            ) : upNext ? (
              <UpNextCard appt={upNext} now={now} showClinic={multiClinic} />
            ) : (
              <div className="flex items-center gap-4 rounded-3xl bg-card p-5">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Coffee className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">No more visits today</p>
                  <p className="text-sm text-muted-foreground">New bookings will show up here.</p>
                </div>
              </div>
            )}
          </section>

          <section aria-label="Summary" className="lg:col-span-2">
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-36 shrink-0 rounded-3xl lg:w-auto" />)
              ) : (
                <>
                  <StatChip icon={Inbox} label="Awaiting" value={data.stats.pending} />
                  <StatChip icon={CalendarCheck} label="Next 7 days" value={data.stats.upcomingWeek} />
                  <StatChip icon={CircleCheck} label="Completed 30d" value={data.stats.completedMonth} />
                  <StatChip icon={Users} label="Patients" value={data.stats.patients} href="/doctor/patients" />
                </>
              )}
            </div>
          </section>

          <section aria-labelledby="needs-title" className="lg:col-span-2 lg:col-start-4 lg:row-start-2">
            <SectionHeader title="Needs confirmation" href="/doctor/appointments?status=pending" />
            <h2 id="needs-title" className="sr-only">
              Needs confirmation
            </h2>
            {loading ? (
              <ListSkeleton rows={2} />
            ) : data.needsAction.length === 0 ? (
              <EmptyState icon={Inbox} title="All caught up" description="No booking requests are waiting for you." />
            ) : (
              <ul className="space-y-3">
                {data.needsAction.map((a) => (
                  <li key={a.id} className="rounded-3xl bg-card p-4">
                    <Link href={`/doctor/appointments/${a.id}`} className="flex items-center gap-3 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
                      <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{a.patient.name}</p>
                        <p className="truncate text-sm text-muted-foreground">Requested {relativeTime(a.createdAt)}</p>
                      </div>
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 tabular-nums">
                        <Clock className="size-4 text-muted-foreground" />
                        {formatDateTime(a.startsAt, a.clinic.timezone)}
                        <ZoneHint timezone={a.clinic.timezone} />
                      </span>
                      {multiClinic && (
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                          <MapPin className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{a.clinic.name}</span>
                        </span>
                      )}
                    </div>
                    {a.reason && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">&ldquo;{a.reason}&rdquo;</p>}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <ConfirmButton appt={a} size="lg" className="h-11" />
                      <CancelButton appt={a} size="lg" className="h-11" label="Decline" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="agenda-title" className="lg:col-span-3 lg:col-start-1 lg:row-start-2">
            <SectionHeader title="Today's agenda" href="/doctor/appointments" />
            <h2 id="agenda-title" className="sr-only">
              Today&apos;s agenda
            </h2>
            {loading ? (
              <ListSkeleton />
            ) : data.today.length === 0 ? (
              <EmptyState icon={Clock} title="No visits today" description="Enjoy the quiet — new bookings will show up here." />
            ) : (
              <ol className="space-y-0">
                {data.today.map((a, i) => (
                  <AgendaItem key={a.id} appt={a} now={now} showClinic={multiClinic} last={i === data.today.length - 1} highlight={a.id === upNext?.id} />
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatChip({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: number; href?: string }) {
  const body = (
    <>
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </>
  );
  const cls = 'block w-36 shrink-0 rounded-3xl bg-card p-4 lg:w-auto';
  return href ? (
    <Link href={href} className={cn(cls, 'transition-colors hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** The single solid blue block: the visit in progress or next up. */
function UpNextCard({ appt: a, now, showClinic }: { appt: Appointment; now: number; showClinic: boolean }) {
  const tz = a.clinic.timezone;
  const acts = availableActions(a, now);
  const current = isCurrent(a, now);
  const onBlue = 'h-12 flex-1 bg-white text-brand hover:bg-white/90';

  return (
    <div className="rounded-3xl bg-brand p-5 text-brand-foreground">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm text-brand-foreground/80">
          {current && <span aria-hidden className="size-2 rounded-full bg-white" />}
          {current ? 'In progress' : 'Up next'}
        </span>
        <Link
          href={`/doctor/appointments/${a.id}`}
          aria-label={`Open visit with ${a.patient.name}`}
          className="inline-flex size-10 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} inverted className="size-14 ring-2 ring-white/30" />
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold">{a.patient.name}</p>
          <p className="truncate text-sm text-brand-foreground/80">{a.reason || 'No reason given'}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 tabular-nums">
          <Clock className="size-4" />
          {formatTime(a.startsAt, tz)} – {formatTime(a.endsAt, tz)}
          <ZoneHint timezone={tz} className="text-brand-foreground/80" />
        </span>
        {showClinic && (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
            <MapPin className="size-4 shrink-0" /> <span className="truncate">{a.clinic.name}</span>
          </span>
        )}
        <StatusBadge status={a.status} className="bg-white py-1.5 text-brand" />
      </div>

      {(acts.confirm || acts.complete) && (
        <div className="mt-5 flex gap-2">
          {acts.confirm ? (
            <ConfirmButton appt={a} size="lg" className={onBlue} />
          ) : (
            <CompleteDialog appt={a} size="lg" variant="default" className={onBlue} tooEarly={acts.completeTooEarly} />
          )}
        </div>
      )}
    </div>
  );
}

function AgendaItem({ appt: a, now, showClinic, last, highlight }: { appt: Appointment; now: number; showClinic: boolean; last: boolean; highlight: boolean }) {
  const tz = a.clinic.timezone;
  const acts = availableActions(a, now);
  const current = isCurrent(a, now);
  const done = a.status === 'completed' || a.status === 'no_show' || a.status === 'cancelled';

  return (
    <li className="grid grid-cols-[4.5rem_1rem_minmax(0,1fr)] gap-x-2">
      <div className="pt-4 text-right leading-tight">
        <p className="text-sm font-semibold whitespace-nowrap tabular-nums">{formatTime(a.startsAt, tz)}</p>
        <p className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{formatTime(a.endsAt, tz)}</p>
      </div>

      <div aria-hidden className="relative flex justify-center">
        <span className={cn('absolute top-0 w-px bg-border', last ? 'h-6' : 'bottom-0')} />
        <span
          className={cn(
            'relative mt-5 size-3 rounded-full ring-4 ring-background',
            current || highlight ? 'bg-primary' : done ? 'bg-muted-foreground/40' : 'bg-foreground'
          )}
        />
      </div>

      <div className={cn('pb-3', done && 'opacity-70')}>
        <div className={cn('rounded-3xl bg-card p-4', (current || highlight) && 'ring-2 ring-primary')}>
          <Link
            href={`/doctor/appointments/${a.id}`}
            className="flex items-center gap-3 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} className="size-11" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{a.patient.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {showClinic ? `${a.clinic.name}${a.reason ? ' · ' : ''}` : ''}
                {a.reason ?? (showClinic ? '' : 'No reason given')}
              </p>
              <div className="mt-1.5">
                {current ? (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">Now</span>
                ) : (
                  <StatusBadge status={a.status} />
                )}
              </div>
            </div>
          </Link>
          {(acts.confirm || acts.complete || acts.noShow) && (
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              {acts.confirm && <ConfirmButton appt={a} size="lg" className="h-11 flex-1" />}
              {acts.complete && <CompleteDialog appt={a} size="lg" className="h-11 flex-1" tooEarly={acts.completeTooEarly} />}
              {acts.noShow && <NoShowButton appt={a} size="lg" className="h-11 flex-1" />}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
