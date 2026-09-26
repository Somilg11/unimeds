'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, CalendarDays, UserPlus, UserX, XCircle } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { STATUS_LABEL } from '@/lib/format';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatCard, StatusBadge, ClientPaged } from '@/components/app/common';
import { clinicKeys, useUrlState } from '../_components/hooks';
import { Panel, PersonAvatar, PILL_TAB, PILL_TABS_LIST } from '../_components/panel';
import type { Analytics } from '../_components/types';

const RANGES = [3, 6, 12] as const;

// Series use the chart tokens in fixed order (1 blue, 2 black, 3 light blue, 4 grey).
// "scheduled" = pending/confirmed/proposed, so each bar's height is the month total.
const SERIES = [
  { key: 'completed', label: 'Completed', color: 'var(--chart-1)' },
  { key: 'scheduled', label: 'Scheduled', color: 'var(--chart-2)' },
  { key: 'cancelled', label: 'Cancelled', color: 'var(--chart-3)' },
  { key: 'noShow', label: 'No-show', color: 'var(--chart-4)' },
] as const;

const monthLabel = (m: string, withYear = false) =>
  new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: withYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(new Date(`${m}-01T00:00:00Z`));

type Row = {
  month: string;
  label: string;
  total: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  noShow: number;
};

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="min-w-44 rounded-2xl bg-popover px-3.5 py-3 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/5">
      <p className="mb-2 font-semibold">{monthLabel(row.month, true)}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-2 py-0.5">
          <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
          <span className="text-muted-foreground">{s.label}</span>
          <span className="ml-auto pl-4 tabular-nums">{row[s.key]}</span>
        </p>
      ))}
      <p className="mt-1.5 flex border-t pt-1.5 font-semibold">
        Total <span className="ml-auto tabular-nums">{row.total}</span>
      </p>
    </div>
  );
}

function AnalyticsView() {
  const { params, set } = useUrlState();
  const months = RANGES.includes(Number(params.get('months')) as (typeof RANGES)[number]) ? Number(params.get('months')) : 6;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...clinicKeys.analytics, months],
    queryFn: () => api.get<Analytics>('/clinic/analytics', { months }),
  });

  const rows: Row[] = (data?.trend ?? []).map((t) => ({
    ...t,
    label: monthLabel(t.month),
    scheduled: Math.max(0, t.total - t.completed - t.cancelled - t.noShow),
  }));
  const breakdownTotal = (data?.statusBreakdown ?? []).reduce((n, s) => n + s.count, 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How your clinic is performing."
        actions={
          <Tabs value={String(months)} onValueChange={(v) => set({ months: v === '6' ? null : v })}>
            <TabsList aria-label="Time range" className={PILL_TABS_LIST}>
              {RANGES.map((r) => (
                <TabsTrigger key={r} value={String(r)} className={PILL_TAB}>
                  {r} months
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : error || !data ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Appointments" value={data.kpis.totalAppointments} icon={CalendarDays} hint="Past visits in range" highlight />
            <StatCard label="No-show rate" value={`${data.kpis.noShowRate}%`} icon={UserX} hint="Of attended + missed visits" />
            <StatCard label="Cancellation rate" value={`${data.kpis.cancellationRate}%`} icon={XCircle} hint="Of past bookings" />
            <StatCard label="New patients" value={data.kpis.newPatients} icon={UserPlus} hint="First visit in range" />
          </div>

          <Panel id="trend-heading" title="Monthly appointments" description="By outcome; bar height is the month’s total bookings.">
            {rows.every((r) => r.total === 0) ? (
              <EmptyState icon={BarChart3} title="No appointments in this period" />
            ) : (
              <div className="h-80" role="img" aria-label={`Monthly appointments over the last ${months} months`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: 'var(--muted-foreground)' }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: 'var(--muted-foreground)' }} />
                    <Tooltip content={<TrendTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      verticalAlign="top"
                      align="right"
                      height={32}
                      wrapperStyle={{
                        fontSize: 12,
                        color: 'var(--muted-foreground)',
                      }}
                    />
                    {SERIES.map((s, i) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.label}
                        stackId="a"
                        fill={s.color}
                        stroke="var(--card)"
                        strokeWidth={2}
                        radius={i === SERIES.length - 1 ? [8, 8, 0, 0] : 0}
                        maxBarSize={48}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Panel id="status-heading" title="Status breakdown" description={`${breakdownTotal} appointments`}>
              {data.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments in this period.</p>
              ) : (
                <ul className="space-y-4">
                  {[...data.statusBreakdown]
                    .sort((a, b) => b.count - a.count)
                    .map((s) => {
                      const pct = breakdownTotal ? Math.round((s.count / breakdownTotal) * 100) : 0;
                      return (
                        <li key={s.status} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <StatusBadge status={s.status} />
                            <span className="tabular-nums">
                              {s.count} <span className="text-muted-foreground">({pct}%)</span>
                            </span>
                          </div>
                          <div
                            className="h-2 overflow-hidden rounded-full bg-muted"
                            role="meter"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={STATUS_LABEL[s.status]}
                          >
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </Panel>

            <Panel id="doctors-heading" title="Doctor performance" description="Appointments in the selected range">
              {data.doctorPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments in this period.</p>
              ) : (
                <ClientPaged items={data.doctorPerformance}>
                  {(rows) => (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-11 pl-0 text-xs font-medium text-muted-foreground">Doctor</TableHead>
                          <TableHead className="h-11 text-right text-xs font-medium text-muted-foreground">Total</TableHead>
                          <TableHead className="hidden h-11 text-xs font-medium text-muted-foreground md:table-cell">Completed</TableHead>
                          <TableHead className="hidden h-11 text-right text-xs font-medium text-muted-foreground sm:table-cell">Cancelled</TableHead>
                          <TableHead className="h-11 text-right text-xs font-medium text-muted-foreground">No-show</TableHead>
                          <TableHead className="hidden h-11 pr-0 text-right text-xs font-medium text-muted-foreground sm:table-cell">
                            Patients
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((d) => {
                          const rate = d.total ? Math.round((d.completed / d.total) * 100) : 0;
                          return (
                            <TableRow key={d.doctorId}>
                              <TableCell className="py-3 pl-0">
                                <span className="flex items-center gap-3">
                                  <PersonAvatar name={d.name} className="size-9 text-xs" />
                                  <span className="min-w-0">
                                    <span className="block max-w-44 truncate font-semibold">{d.name}</span>
                                    {d.specialization && (
                                      <span className="block max-w-44 truncate text-xs text-muted-foreground">{d.specialization}</span>
                                    )}
                                  </span>
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">{d.total}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-20 overflow-hidden rounded-full bg-muted"
                                    role="meter"
                                    aria-valuenow={rate}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`${d.name} completion rate`}
                                  >
                                    <span className="block h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                                  </span>
                                  <span className="tabular-nums">{d.completed}</span>
                                  <span className="text-xs text-muted-foreground tabular-nums">({rate}%)</span>
                                </span>
                              </TableCell>
                              <TableCell className="hidden text-right tabular-nums sm:table-cell">{d.cancelled}</TableCell>
                              <TableCell className="text-right tabular-nums">{d.noShow}</TableCell>
                              <TableCell className="hidden pr-0 text-right tabular-nums sm:table-cell">{d.patients}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </ClientPaged>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

export default function ClinicAnalyticsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <AnalyticsView />
    </Suspense>
  );
}
