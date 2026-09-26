'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building2, CalendarCheck, ChevronRight, FileText, MailQuestion, PauseCircle, Stethoscope, UserPlus, Users, type LucideIcon } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { ErrorState, PageHeader, StatCard } from '@/components/app/common';
import { Skeleton } from '@/components/ui/skeleton';
import { IconCircle, Panel } from './_components/bits';
import type { AdminOverview } from './_components/types';

const dayLabel = (day: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
const n = (v: number) => v.toLocaleString('en-IN');

const SERIES = [
  { key: 'bookings', name: 'Bookings', color: 'var(--chart-1)' },
  { key: 'signups', name: 'Signups', color: 'var(--chart-2)' },
] as const;

type ActivityRow = AdminOverview['activity'][number];

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ActivityRow }> }) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="min-w-36 rounded-2xl bg-popover px-3.5 py-3 text-xs text-popover-foreground shadow-md ring-1 ring-border">
      <p className="mb-2 font-semibold">{dayLabel(row.day)}</p>
      {SERIES.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-4 py-0.5">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.name}
          </span>
          <span className="font-semibold tabular-nums">{n(row[s.key])}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityChart({ activity }: { activity: AdminOverview['activity'] }) {
  const totals = { bookings: activity.reduce((s, d) => s + d.bookings, 0), signups: activity.reduce((s, d) => s + d.signups, 0) };
  return (
    <Panel
      title="Platform activity"
      titleId="activity-heading"
      description="Daily bookings and new signups, last 30 days"
      actions={
        <ul className="flex flex-wrap gap-2" aria-label="Legend">
          {SERIES.map((s) => (
            <li key={s.key} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
              <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.name}
              <span className="text-muted-foreground tabular-nums">{n(totals[s.key])}</span>
            </li>
          ))}
        </ul>
      }
    >
      <div className="h-80" role="img" aria-label={`Daily bookings and signups over the last 30 days: ${totals.bookings} bookings and ${totals.signups} signups.`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activity} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tickFormatter={dayLabel} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} minTickGap={24} dy={8} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
            <Tooltip content={<ActivityTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="bookings"
              name="Bookings"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              fill="var(--chart-1)"
              fillOpacity={0.08}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="signups"
              name="Signups"
              stroke="var(--chart-2)"
              strokeWidth={2}
              fill="none"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function MetricRow({ icon, label, value, hint, href }: { icon: LucideIcon; label: string; value: number; hint?: string; href?: string }) {
  const body = (
    <>
      <IconCircle icon={icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className="text-lg font-bold tabular-nums">{n(value)}</span>
      {href && <ChevronRight className="size-4 text-muted-foreground" aria-hidden />}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="-mx-3 flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 py-3">{body}</div>
      )}
    </li>
  );
}

export default function AdminOverviewPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get<AdminOverview>('/admin/overview'),
  });

  return (
    <>
      <PageHeader title="Platform overview" description="Tenants, users and activity across Unimeds." />
      {isPending ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Skeleton className="h-96 rounded-3xl xl:col-span-2" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="kpi-heading">
            <h2 id="kpi-heading" className="sr-only">
              Key numbers
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Active clinics" value={n(data.clinics.active)} hint={`${n(data.clinics.total)} clinics in total`} icon={Building2} highlight />
              <StatCard label="Patients" value={n(data.users.patients)} hint={`${n(data.users.newLast30)} new users in 30 days`} icon={Users} />
              <StatCard label="Doctors" value={n(data.users.doctors)} hint={`${n(data.users.admins)} clinic admins`} icon={Stethoscope} />
              <StatCard
                label="Appointments (30 days)"
                value={n(data.appointments.last30)}
                hint={`${n(data.appointments.total)} all time · ${n(data.appointments.completed)} completed`}
                icon={CalendarCheck}
              />
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <ActivityChart activity={data.activity} />
            </div>

            <div className="space-y-6">
              <Panel title="Clinics" titleId="clinics-heading" description={`${n(data.clinics.total)} tenants on the platform`}>
                <ul className="-my-3 divide-y">
                  <MetricRow icon={Building2} label="Active" hint="Accepting bookings" value={data.clinics.active} href="/admin/clinics?status=active" />
                  <MetricRow icon={MailQuestion} label="Awaiting admin" hint="Invited, not yet accepted" value={data.clinics.invited} href="/admin/clinics?status=invited" />
                  <MetricRow icon={PauseCircle} label="Suspended" hint="Access paused" value={data.clinics.suspended} href="/admin/clinics?status=suspended" />
                </ul>
              </Panel>
              <Panel title="Usage" titleId="usage-heading">
                <ul className="-my-3 divide-y">
                  <MetricRow icon={UserPlus} label="New users" hint="Last 30 days" value={data.users.newLast30} href="/admin/users" />
                  <MetricRow icon={FileText} label="Medical records" hint="Stored across all clinics" value={data.records} />
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
