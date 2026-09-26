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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { AppointmentRow } from '../_components/appointment-row';
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
    pageSize: 20,
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
          <Button asChild>
            <Link href="/clinic/appointments/new">
              <CalendarPlus /> New booking
            </Link>
          </Button>
        }
      />

      <div className="mb-6 space-y-4">
        <Tabs value={scope} onValueChange={(v) => set({ scope: v === 'upcoming' ? null : v })}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <SearchInput key={q} value={q} onSearch={(v) => set({ q: v })} placeholder="Patient name or email" label="Search appointments" />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="f-status" className="text-xs text-muted-foreground">
                Status
              </Label>
              <Select value={status || ALL} onValueChange={(v) => set({ status: v === ALL ? null : v })}>
                <SelectTrigger id="f-status" className="w-full sm:w-48">
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-doctor" className="text-xs text-muted-foreground">
                Doctor
              </Label>
              <Select value={doctorId || ALL} onValueChange={(v) => set({ doctor: v === ALL ? null : v })}>
                <SelectTrigger id="f-doctor" className="w-full sm:w-48">
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input id="f-from" type="date" value={from} max={to || undefined} onChange={(e) => set({ from: e.target.value })} className="sm:w-40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input id="f-to" type="date" value={to} min={from || undefined} onChange={(e) => set({ to: e.target.value })} className="sm:w-40" />
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => set({ status: null, doctor: null, from: null, to: null, q: null })}>
              <X /> Clear filters
            </Button>
          )}
        </div>
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
          <ul className="space-y-3">
            {data.items.map((a) => (
              <AppointmentRow key={a.id} appointment={a} onOpen={(id) => set({ focus: id }, { resetPage: false })} />
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: p })} />
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
