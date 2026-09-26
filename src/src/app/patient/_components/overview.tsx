'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BellRing, CalendarCheck, CalendarDays, CalendarPlus, FileText, Stethoscope } from 'lucide-react';
import { api, errorMessage, recordFileUrl } from '@/lib/api';
import { formatBytes, RECORD_TYPE_LABEL, relativeTime } from '@/lib/format';
import type { Appointment, Paged, RecordItem } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatCard } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentRow, apptTime, PK, RespondButtons, useMe } from './shared';

type Overview = {
  upcoming: Appointment[];
  recentRecords: RecordItem[];
  stats: { upcoming: number; completed: number; actionRequired: number; records: number };
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Proposals can sit beyond the first five upcoming visits, so fetch them explicitly. */
function ActionRequired({ count }: { count: number }) {
  const { data } = useQuery({
    queryKey: PK.appointments({ status: 'reschedule_proposed', page: 1, pageSize: 10 }),
    queryFn: () => api.get<Paged<Appointment>>('/patient/appointments', { status: 'reschedule_proposed', page: 1, pageSize: 10 }),
    enabled: count > 0,
  });
  const items = data?.items ?? [];
  if (!count || !items.length) return null;
  return (
    <section aria-labelledby="action-required" className="mb-8 space-y-3 rounded-xl border border-sky-300/60 bg-sky-50 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
      <h2 id="action-required" className="flex items-center gap-2 font-medium">
        <BellRing className="size-4" /> Action required
      </h2>
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="flex flex-col gap-3 rounded-lg bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5 text-sm">
              <p>
                <Link href={`/patient/appointments/${a.id}`} className="font-medium hover:underline">
                  {a.doctor.name}
                </Link>{' '}
                at {a.clinic.name} proposed a new time
              </p>
              <p className="text-muted-foreground">
                <span className="line-through">{apptTime(a.startsAt, a.clinic.timezone)}</span>
                {a.proposedStartsAt && (
                  <>
                    {' → '}
                    <span className="font-medium text-foreground">{apptTime(a.proposedStartsAt, a.clinic.timezone)}</span>
                  </>
                )}
              </p>
              {a.rescheduleReason && <p className="text-muted-foreground">“{a.rescheduleReason}”</p>}
            </div>
            <RespondButtons appointment={a} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PatientOverview() {
  const me = useMe();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: PK.overview,
    queryFn: () => api.get<Overview>('/patient/overview'),
  });
  const firstName = me.data?.name.split(/\s+/)[0];

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        description="Your visits, documents and care in one place."
        actions={
          <Button asChild>
            <Link href="/patient/book">
              <CalendarPlus /> Book a visit
            </Link>
          </Button>
        }
      />

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <ActionRequired count={data?.stats.actionRequired ?? 0} />

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {isLoading || !data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : (
              <>
                <StatCard label="Upcoming visits" value={data.stats.upcoming} icon={CalendarDays} />
                <StatCard label="Needs your reply" value={data.stats.actionRequired} icon={BellRing} />
                <StatCard label="Completed visits" value={data.stats.completed} icon={CalendarCheck} />
                <StatCard label="Documents" value={data.stats.records} icon={FileText} />
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  <h2>Next appointments</h2>
                </CardTitle>
                <Button variant="link" size="sm" asChild>
                  <Link href="/patient/appointments">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ListSkeleton rows={3} />
                ) : data?.upcoming.length ? (
                  <ul className="space-y-3">
                    {data.upcoming.map((a) => (
                      <li key={a.id}>
                        <AppointmentRow appointment={a} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={Stethoscope}
                    title="No upcoming visits"
                    description="Find a doctor near you and book a time that suits you."
                    action={
                      <Button asChild>
                        <Link href="/patient/book">Find care</Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  <h2>Recent documents</h2>
                </CardTitle>
                <Button variant="link" size="sm" asChild>
                  <Link href="/patient/records">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ListSkeleton rows={3} />
                ) : data?.recentRecords.length ? (
                  <ul className="divide-y">
                    {data.recentRecords.map((r) => (
                      <li key={r.id}>
                        <a
                          href={recordFileUrl(r.id)}
                          target="_blank"
                          rel="noopener"
                          className="flex items-center gap-3 rounded-lg px-1 py-3 hover:bg-muted/50"
                        >
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{r.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {RECORD_TYPE_LABEL[r.recordType]} · {formatBytes(r.fileSize)} · {relativeTime(r.createdAt)}
                            </p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={FileText} title="No documents yet" description="Upload prescriptions, lab reports and scans to keep them handy." />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
