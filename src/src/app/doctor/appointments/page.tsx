'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CalendarX, ChevronRight, Clock } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatTime, STATUS_LABEL } from '@/lib/format';
import type { Appointment, AppointmentStatus, Paged } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, Pagination, StatusBadge } from '@/components/app/common';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterPill, PersonAvatar, PILL_TAB, PILL_TABS_LIST, SearchInput, ZoneHint } from '../_components/bits';
import { useDoctorClinics, useUrlFilters, type DoctorClinic } from '../_components/hooks';

const SCOPES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
] as const;
type Scope = (typeof SCOPES)[number]['value'];

const STATUSES = Object.keys(STATUS_LABEL) as AppointmentStatus[];

function AppointmentCard({ appt: a, clinics }: { appt: Appointment; clinics: DoctorClinic[] }) {
  const tz = a.clinic.timezone;
  return (
    <Link
      href={`/doctor/appointments/${a.id}`}
      className="block rounded-3xl bg-card p-4 transition-colors hover:bg-card/70 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{a.patient.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {clinics.length > 1 ? `${a.clinic.name}${a.reason ? ' · ' : ''}` : ''}
            {a.reason ?? (clinics.length > 1 ? '' : 'No reason given')}
          </p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="size-4 text-muted-foreground" />
          </span>
          <span className="leading-tight">
            <span className="block text-xs text-muted-foreground">Date</span>
            <span className="font-medium">{formatDate(a.startsAt, tz)}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Clock className="size-4 text-muted-foreground" />
          </span>
          <span className="leading-tight">
            <span className="block text-xs text-muted-foreground">Time</span>
            <span className="font-medium tabular-nums">
              {formatTime(a.startsAt, tz)}
              <ZoneHint timezone={tz} />
            </span>
          </span>
        </span>
      </div>
    </Link>
  );
}

function AppointmentsTable({ items, clinics }: { items: Appointment[]; clinics: DoctorClinic[] }) {
  const router = useRouter();
  return (
    <div className="rounded-3xl bg-card p-2">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Patient</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            {clinics.length > 1 && <TableHead>Clinic</TableHead>}
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => (
            <TableRow key={a.id} className="cursor-pointer" onClick={() => router.push(`/doctor/appointments/${a.id}`)}>
              <TableCell className="py-3 pl-4">
                <Link href={`/doctor/appointments/${a.id}`} className="flex items-center gap-3 font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
                  <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} className="size-9" />
                  <span className="max-w-48 truncate">{a.patient.name}</span>
                </Link>
              </TableCell>
              <TableCell>{formatDate(a.startsAt, a.clinic.timezone)}</TableCell>
              <TableCell className="tabular-nums">
                {formatTime(a.startsAt, a.clinic.timezone)}
                <ZoneHint timezone={a.clinic.timezone} />
              </TableCell>
              {clinics.length > 1 && <TableCell className="max-w-40 truncate">{a.clinic.name}</TableCell>}
              <TableCell className="max-w-64 truncate text-muted-foreground">{a.reason ?? 'No reason given'}</TableCell>
              <TableCell>
                <StatusBadge status={a.status} />
              </TableCell>
              <TableCell>
                <ChevronRight className="size-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AppointmentsView() {
  const { params, set, page } = useUrlFilters();
  const scopeParam = params.get('scope');
  const scope: Scope = scopeParam === 'past' || scopeParam === 'all' ? scopeParam : 'upcoming';
  const statusParam = params.get('status');
  const status = statusParam && (STATUSES as string[]).includes(statusParam) ? (statusParam as AppointmentStatus) : undefined;
  const clinicId = params.get('clinic') ?? undefined;
  const q = params.get('q') ?? '';

  const clinics = useDoctorClinics().data?.items ?? [];
  const pageSize = Number(params.get('size')) || 20;
  const filters = { scope, status, clinicId, q: q || undefined, page, pageSize };
  const { data, isLoading, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['doctor', 'appointments', filters],
    queryFn: () => api.get<Paged<Appointment>>('/doctor/appointments', filters),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Visits</h1>
        <p className="text-sm text-muted-foreground">Your appointments across all your clinics.</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={scope} onValueChange={(v) => set({ scope: v === 'upcoming' ? null : v })}>
            <TabsList aria-label="Time range" className={cn(PILL_TABS_LIST, 'w-full lg:w-fit')}>
              {SCOPES.map((s) => (
                <TabsTrigger key={s.value} value={s.value} className={PILL_TAB}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <SearchInput initial={q} onSearch={(v) => set({ q: v })} placeholder="Search patient name" label="Search by patient name" />
        </div>

        <div role="group" aria-label="Filter by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          <FilterPill active={!status} onClick={() => set({ status: null })}>
            All statuses
          </FilterPill>
          {STATUSES.map((s) => (
            <FilterPill key={s} active={status === s} onClick={() => set({ status: s })}>
              {STATUS_LABEL[s]}
            </FilterPill>
          ))}
        </div>

        {clinics.length > 1 && (
          <div role="group" aria-label="Filter by clinic" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
            <FilterPill active={!clinicId} onClick={() => set({ clinic: null })}>
              All clinics
            </FilterPill>
            {clinics.map((c) => (
              <FilterPill key={c.id} active={clinicId === c.id} onClick={() => set({ clinic: c.id })}>
                {c.name}
              </FilterPill>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton rows={6} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No appointments found"
          description={q || status || clinicId ? 'Try clearing the filters.' : scope === 'upcoming' ? 'New bookings will appear here.' : undefined}
        />
      ) : (
        <div>
          <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
            <ul className="space-y-3 lg:hidden">
              {data.items.map((a) => (
                <li key={a.id}>
                  <AppointmentCard appt={a} clinics={clinics} />
                </li>
              ))}
            </ul>
            <div className="hidden lg:block">
              <AppointmentsTable items={data.items} clinics={clinics} />
            </div>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 20 ? null : n })} />
        </div>
      )}
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <AppointmentsView />
    </Suspense>
  );
}
