'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, Clock, FileText, MapPin, Search, Stethoscope } from 'lucide-react';
import { api, errorMessage, recordFileUrl } from '@/lib/api';
import { formatBytes, initials, RECORD_TYPE_LABEL, relativeTime } from '@/lib/format';
import type { Appointment, Paged, RecordItem } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, SectionHeader, StatusBadge } from '@/components/app/common';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentRow, apptDayTime, apptTime, PK, RespondButtons, useMe } from './shared';

type Overview = {
  upcoming: Appointment[];
  recentRecords: RecordItem[];
  stats: { upcoming: number; completed: number; actionRequired: number; records: number };
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/patient/book?q=${encodeURIComponent(q.trim())}` : '/patient/book');
      }}
      className="relative"
    >
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a doctor or specialty"
        aria-label="Search a doctor or specialty"
        className="h-13 rounded-full border-0 bg-card pl-12 text-base shadow-none"
      />
    </form>
  );
}

function Specialties() {
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'specializations'],
    queryFn: () => api.get<{ items: Array<{ name: string; doctors: number }> }>('/public/specializations'),
    staleTime: 5 * 60_000,
  });
  if (!isLoading && !data?.items.length) return null;
  return (
    <section aria-labelledby="specialties">
      <SectionHeader title="Specialties" href="/patient/book" linkLabel="View all" />
      <h2 id="specialties" className="sr-only">
        Specialties
      </h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-36 shrink-0 rounded-full" />)
          : data!.items.map((s) => (
              <Link
                key={s.name}
                href={`/patient/book?specialization=${encodeURIComponent(s.name)}`}
                className="flex shrink-0 items-center gap-2 rounded-full bg-card py-1.5 pr-4 pl-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Stethoscope className="size-4" />
                </span>
                {s.name}
              </Link>
            ))}
      </div>
    </section>
  );
}

/** The next visit as a solid blue card, like a boarding pass. */
function NextVisit({ appointment: a }: { appointment: Appointment }) {
  const { date, time } = apptDayTime(a.startsAt, a.clinic.timezone);
  return (
    <Link href={`/patient/appointments/${a.id}`} className="block rounded-3xl bg-brand p-5 text-brand-foreground transition-opacity hover:opacity-95">
      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-foreground/80">Your next visit</span>
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/20">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Avatar className="size-12 ring-2 ring-white/30">
          {a.doctor.avatarUrl && <AvatarImage src={a.doctor.avatarUrl} alt="" />}
          <AvatarFallback className="bg-white font-semibold text-brand">{initials(a.doctor.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{a.doctor.name}</p>
          <p className="truncate text-sm text-brand-foreground/80">{a.doctor.specialization ?? 'Doctor'}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
          <CalendarDays className="size-4" /> {date}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
          <Clock className="size-4" /> {time}
        </span>
        <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/15 px-3 py-1.5">
          <MapPin className="size-4 shrink-0" /> <span className="truncate">{a.clinic.name}</span>
        </span>
      </div>
      <div className="mt-4">
        <StatusBadge status={a.status} tone="inverted" />
      </div>
    </Link>
  );
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
    <section aria-labelledby="action-required" className="space-y-3">
      <SectionHeader title="Needs your reply" />
      <h2 id="action-required" className="sr-only">
        Needs your reply
      </h2>
      {items.map((a) => (
        <div key={a.id} className="space-y-3 rounded-3xl border-2 border-primary/30 bg-card p-4">
          <p className="text-sm">
            <Link href={`/patient/appointments/${a.id}`} className="font-semibold hover:underline">
              {a.doctor.name}
            </Link>{' '}
            proposed a new time
          </p>
          <div className="text-sm">
            <p className="text-muted-foreground line-through">{apptTime(a.startsAt, a.clinic.timezone)}</p>
            {a.proposedStartsAt && <p className="font-semibold">{apptTime(a.proposedStartsAt, a.clinic.timezone)}</p>}
          </div>
          {a.rescheduleReason && <p className="text-sm text-muted-foreground">“{a.rescheduleReason}”</p>}
          <RespondButtons appointment={a} />
        </div>
      ))}
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
  const [next, ...rest] = data?.upcoming ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="hidden text-sm text-muted-foreground lg:block">{firstName ? `${greeting()}, ${firstName}` : greeting()}</p>
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Manage your health
            <br className="sm:hidden" /> with ease
          </h1>
        </div>
        <div className="lg:hidden">
          <SearchBar />
        </div>
      </div>

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <ActionRequired count={data?.stats.actionRequired ?? 0} />

          <Specialties />

          <div className="grid gap-8 lg:grid-cols-5">
            <section className="space-y-3 lg:col-span-3" aria-labelledby="upcoming">
              <SectionHeader title="Upcoming appointments" href="/patient/appointments" />
              <h2 id="upcoming" className="sr-only">
                Upcoming appointments
              </h2>
              {isLoading ? (
                <ListSkeleton rows={2} />
              ) : next ? (
                <>
                  <NextVisit appointment={next} />
                  {rest.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
                  ))}
                </>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="No upcoming visits"
                  description="Find a doctor near you and book a time that suits you."
                  action={
                    <Button asChild>
                      <Link href="/patient/book">Book a visit</Link>
                    </Button>
                  }
                />
              )}
            </section>

            <section className="space-y-3 lg:col-span-2" aria-labelledby="documents">
              <SectionHeader title="Recent documents" href="/patient/records" />
              <h2 id="documents" className="sr-only">
                Recent documents
              </h2>
              {isLoading ? (
                <ListSkeleton rows={3} />
              ) : data?.recentRecords.length ? (
                <ul className="divide-y rounded-3xl bg-card px-4">
                  {data.recentRecords.map((r) => (
                    <li key={r.id}>
                      <a href={recordFileUrl(r.id)} target="_blank" rel="noopener" className="flex items-center gap-3 py-3.5">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <FileText className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{r.title}</p>
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
            </section>
          </div>
        </>
      )}
    </div>
  );
}
