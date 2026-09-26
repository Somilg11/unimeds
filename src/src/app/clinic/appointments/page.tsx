'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CalendarPlus, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Appointment, AppointmentStatus, Paged } from '@/lib/types';
import { isBrowserZone, STATUS_LABEL, zoneLabel } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { cn } from '@/lib/utils';
import { AppointmentTable } from '../_components/appointment-table';
import { Panel, PILL_TAB, PILL_TABS_LIST, PILL_TRIGGER } from '../_components/panel';
import { AppointmentSheet } from '../_components/appointment-sheet';
import { SearchInput } from '../_components/search-input';
import { clinicKeys, useClinic, useTeam, useUrlState } from '../_components/hooks';
import { zonedDayStartIso } from '../_components/utils';

const SCOPES = ['upcoming', 'past', 'all'] as const;
type Scope = (typeof SCOPES)[number];
const STATUSES = Object.keys(STATUS_LABEL) as AppointmentStatus[];
const ALL = '__all';

function AppointmentsView() {
  const { params, set, page } = useUrlState();
  const { data: clinic } = useClinic();
  const { data: team } = useTeam();
  const tz = clinic?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const scope: Scope = SCOPES.includes(params.get('scope') as Scope) ? (params.get('scope') as Scope) : 'upcoming';
  const status = params.get('status') ?? '';
  const doctorId = params.get('doctor') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const q = params.get('q') ?? '';
  const focus = params.get('focus');

  const filters = {
    scope,
    status: status || undefined,
    doctorId: doctorId || undefined,
    // Date inputs are clinic-local days; `to` is inclusive for the user, exclusive for the API
    from: from ? zonedDayStartIso(from, tz) : undefined,
    to: to ? zonedDayStartIso(to, tz, 1) : undefined,
    q: q || undefined,
    page,
    pageSize: Number(params.get('size')) || 20,
  };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...clinicKeys.appointments, filters],
    queryFn: () => api.get<Paged<Appointment>>('/clinic/appointments', filters),
    enabled: Boolean(clinic) || (!from && !to),
  });

  const doctors = (team?.members ?? []).filter((m) => m.role === 'doctor');
  const hasFilters = Boolean(status || doctorId || from || to || q);

  return (
    <>
      <PageHeader
        title="Appointments"
        description={clinic && !isBrowserZone(clinic.timezone) ? `Times shown in clinic time (${zoneLabel(clinic.timezone)})` : undefined}
        actions={
          <Button asChild size="lg">
            <Link href="/clinic/appointments/new">
              <CalendarPlus /> New booking
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={scope} onValueChange={(v) => set({ scope: v === 'upcoming' ? null : v })}>
          <TabsList className={PILL_TABS_LIST}>
            <TabsTrigger value="upcoming" className={PILL_TAB}>
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className={PILL_TAB}>
              Past
            </TabsTrigger>
            <TabsTrigger value="all" className={PILL_TAB}>
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchInput key={q} value={q} onSearch={(v) => set({ q: v })} placeholder="Patient name or email" label="Search appointments" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Select value={status || ALL} onValueChange={(v) => set({ status: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Status" className={cn(PILL_TRIGGER, 'w-44', status && 'bg-accent text-accent-foreground')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={doctorId || ALL} onValueChange={(v) => set({ doctor: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Doctor" className={cn(PILL_TRIGGER, 'w-52', doctorId && 'bg-accent text-accent-foreground')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All doctors</SelectItem>
            {doctors.map((m) => (
              <SelectItem key={m.user.id} value={m.user.id}>
                {m.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex h-10 items-center gap-2 rounded-full bg-card pr-2 pl-4 text-sm">
          <span className="text-muted-foreground">From</span>
          <Input
            type="date"
            aria-label="From date"
            value={from}
            max={to || undefined}
            onChange={(e) => set({ from: e.target.value })}
            className="h-8 w-38 rounded-full border-0 bg-muted px-3 shadow-none"
          />
        </label>
        <label className="flex h-10 items-center gap-2 rounded-full bg-card pr-2 pl-4 text-sm">
          <span className="text-muted-foreground">To</span>
          <Input
            type="date"
            aria-label="To date"
            value={to}
            min={from || undefined}
            onChange={(e) => set({ to: e.target.value })}
            className="h-8 w-38 rounded-full border-0 bg-muted px-3 shadow-none"
          />
        </label>
        {hasFilters && (
          <Button variant="ghost" onClick={() => set({ status: null, doctor: null, from: null, to: null, q: null })}>
            <X /> Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={CalendarDays}
          title={hasFilters ? 'No appointments match these filters' : scope === 'upcoming' ? 'No upcoming appointments' : 'No appointments yet'}
          description={hasFilters ? 'Try widening the date range or clearing filters.' : undefined}
        />
      ) : (
        <>
          <Panel
            title={scope === 'upcoming' ? 'Upcoming appointments' : scope === 'past' ? 'Past appointments' : 'All appointments'}
            description={`${data.total} ${data.total === 1 ? 'appointment' : 'appointments'}`}
          >
            <AppointmentTable items={data.items} onOpen={(id) => set({ focus: id }, { resetPage: false })} />
          </Panel>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 20 ? null : n })} />
        </>
      )}

      <AppointmentSheet id={focus} onClose={() => set({ focus: null }, { resetPage: false })} />
    </>
  );
}

export default function ClinicAppointmentsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <AppointmentsView />
    </Suspense>
  );
}
