'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarX, ChevronRight } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatTime, STATUS_LABEL } from '@/lib/format';
import type { Appointment, AppointmentStatus, Paged } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination, StatusBadge } from '@/components/app/common';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput, ZoneHint } from '../_components/bits';
import { useDoctorClinics, useUrlFilters } from '../_components/hooks';

const SCOPES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
] as const;
type Scope = (typeof SCOPES)[number]['value'];

const STATUSES = Object.keys(STATUS_LABEL) as AppointmentStatus[];

function AppointmentsView() {
  const { params, set, page } = useUrlFilters();
  const scopeParam = params.get('scope');
  const scope: Scope = scopeParam === 'past' || scopeParam === 'all' ? scopeParam : 'upcoming';
  const statusParam = params.get('status');
  const status = statusParam && (STATUSES as string[]).includes(statusParam) ? (statusParam as AppointmentStatus) : undefined;
  const clinicId = params.get('clinic') ?? undefined;
  const q = params.get('q') ?? '';

  const clinics = useDoctorClinics().data?.items ?? [];
  const filters = { scope, status, clinicId, q: q || undefined, page };
  const { data, isLoading, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['doctor', 'appointments', filters],
    queryFn: () => api.get<Paged<Appointment>>('/doctor/appointments', filters),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader title="Appointments" description="Your visits across all your clinics." />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={scope} onValueChange={(v) => set({ scope: v === 'upcoming' ? null : v })}>
          <TabsList aria-label="Time range">
            {SCOPES.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput initial={q} onSearch={(v) => set({ q: v })} placeholder="Search patient name" label="Search by patient name" />
          <Select value={status ?? 'all'} onValueChange={(v) => set({ status: v })}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {clinics.length > 1 && (
            <Select value={clinicId ?? 'all'} onValueChange={(v) => set({ clinic: v })}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Filter by clinic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clinics</SelectItem>
                {clinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
        <>
          <ul className={`divide-y rounded-xl border bg-card transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
            {data.items.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/doctor/appointments/${a.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <div className="w-24 shrink-0 text-sm sm:w-32">
                    <p className="font-medium">{formatDate(a.startsAt, a.clinic.timezone)}</p>
                    <p className="text-muted-foreground tabular-nums">
                      {formatTime(a.startsAt, a.clinic.timezone)}
                      <ZoneHint timezone={a.clinic.timezone} />
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.patient.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {clinics.length > 1 ? `${a.clinic.name}${a.reason ? ' · ' : ''}` : ''}
                      {a.reason ?? (clinics.length > 1 ? '' : 'No reason given')}
                    </p>
                    <StatusBadge status={a.status} className="mt-1 sm:hidden" />
                  </div>
                  <StatusBadge status={a.status} className="hidden sm:inline-flex" />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}

export default function DoctorAppointmentsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <AppointmentsView />
    </Suspense>
  );
}
