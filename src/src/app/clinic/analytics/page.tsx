'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, CalendarDays, UserPlus, UserX, XCircle } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { STATUS_LABEL } from '@/lib/format';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatCard, StatusBadge } from '@/components/app/common';
import { clinicKeys, useUrlState } from '../_components/hooks';
import type { Analytics } from '../_components/types';

const RANGES = [3, 6, 12] as const;

// Series in fixed order; "scheduled" = pending/confirmed/proposed, so each bar's height is the month total
const SERIES = [
  { key: 'completed', label: 'Completed', color: '#059669' },
  { key: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { key: 'cancelled', label: 'Cancelled', color: '#94a3b8' },
  { key: 'noShow', label: 'No-show', color: '#e11d48' },
] as const;

const monthLabel = (m: string, withYear = false) =>
  new Intl.DateTimeFormat('en-IN', { month: 'short', year: withYear ? 'numeric' : undefined, timeZone: 'UTC' }).format(new Date(`${m}-01T00:00:00Z`));

type Row = { month: string; label: string; total: number; completed: number; scheduled: number; cancelled: number; noShow: number };

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{monthLabel(row.month, true)}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
          <span className="text-muted-foreground">{s.label}</span>
          <span className="ml-auto pl-4 tabular-nums">{row[s.key]}</span>
        </p>
      ))}
      <p className="mt-1 flex border-t pt-1 font-medium">
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
            <TabsList aria-label="Time range">
              {RANGES.map((r) => (
                <TabsTrigger key={r} value={String(r)}>
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
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Appointments" value={data.kpis.totalAppointments} icon={CalendarDays} hint="Past visits in range" />
            <StatCard label="No-show rate" value={`${data.kpis.noShowRate}%`} icon={UserX} hint="Of attended + missed visits" />
            <StatCard label="Cancellation rate" value={`${data.kpis.cancellationRate}%`} icon={XCircle} hint="Of past bookings" />
            <StatCard label="New patients" value={data.kpis.newPatients} icon={UserPlus} hint="First visit in range" />
          </div>

          <section aria-labelledby="trend-heading" className="rounded-xl border bg-card p-5">
            <h2 id="trend-heading" className="font-semibold">
              Monthly appointments
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">By outcome; bar height is the month&apos;s total bookings.</p>
            {rows.every((r) => r.total === 0) ? (
              <EmptyState icon={BarChart3} title="No appointments in this period" />
            ) : (
              <div className="h-72" role="img" aria-label={`Monthly appointments over the last ${months} months`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: 'var(--muted-foreground)' }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: 'var(--muted-foreground)' }} />
                    <Tooltip content={<TrendTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    {SERIES.map((s, i) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.label}
                        stackId="a"
                        fill={s.color}
                        stroke="var(--card)"
                        strokeWidth={1}
                        radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                        maxBarSize={48}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
            <section aria-labelledby="status-heading" className="rounded-xl border bg-card p-5">
              <h2 id="status-heading" className="mb-4 font-semibold">
                Status breakdown
              </h2>
              {data.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments in this period.</p>
              ) : (
                <ul className="space-y-3">
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
                            className="h-1.5 overflow-hidden rounded-full bg-muted"
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
            </section>

            <section aria-labelledby="doctors-heading" className="rounded-xl border bg-card p-5">
              <h2 id="doctors-heading" className="mb-4 font-semibold">
                Doctor performance
              </h2>
              {data.doctorPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments in this period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">Cancelled</TableHead>
                      <TableHead className="text-right">No-show</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">Patients</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.doctorPerformance.map((d) => (
                      <TableRow key={d.doctorId}>
                        <TableCell>
                          <span className="block font-medium">{d.name}</span>
                          {d.specialization && <span className="block text-xs text-muted-foreground">{d.specialization}</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{d.total}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.completed}</TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">{d.cancelled}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.noShow}</TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">{d.patients}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
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
