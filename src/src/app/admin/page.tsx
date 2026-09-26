'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Building2, CalendarCheck, FileText, MailQuestion, PauseCircle, Stethoscope, UserPlus, Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { ErrorState, PageHeader, StatCard } from '@/components/app/common';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminOverview } from './_components/types';

const dayLabel = (day: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
const n = (v: number) => v.toLocaleString('en-IN');

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
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="clinics-heading" className="space-y-3">
            <h2 id="clinics-heading" className="text-sm font-medium text-muted-foreground">
              Clinics
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Active clinics" value={n(data.clinics.active)} hint={`${n(data.clinics.total)} total`} icon={Building2} />
              <StatCard label="Awaiting admin" value={n(data.clinics.invited)} hint="Invited, not yet accepted" icon={MailQuestion} />
              <StatCard label="Suspended" value={n(data.clinics.suspended)} icon={PauseCircle} />
            </div>
          </section>

          <section aria-labelledby="usage-heading" className="space-y-3">
            <h2 id="usage-heading" className="text-sm font-medium text-muted-foreground">
              Usage
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Patients" value={n(data.users.patients)} icon={Users} />
              <StatCard label="Doctors" value={n(data.users.doctors)} hint={`${n(data.users.admins)} clinic admins`} icon={Stethoscope} />
              <StatCard
                label="Appointments (30 days)"
                value={n(data.appointments.last30)}
                hint={`${n(data.appointments.total)} all time · ${n(data.appointments.completed)} completed`}
                icon={CalendarCheck}
              />
              <StatCard label="Medical records" value={n(data.records)} icon={FileText} />
              <StatCard label="New users (30 days)" value={n(data.users.newLast30)} icon={UserPlus} />
            </div>
          </section>

          <section aria-labelledby="activity-heading" className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="activity-heading" className="font-medium">
                Last 30 days
              </h2>
              <Activity className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="h-72" role="img" aria-label={`Daily bookings and signups over the last 30 days: ${data.activity.reduce((s, d) => s + d.bookings, 0)} bookings and ${data.activity.reduce((s, d) => s + d.signups, 0)} signups.`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.activity} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="fill-bookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fill-signups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tickFormatter={dayLabel} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    labelFormatter={(label) => dayLabel(String(label))}
                    contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="bookings" name="Bookings" stroke="var(--primary)" strokeWidth={2} fill="url(#fill-bookings)" />
                  <Area type="monotone" dataKey="signups" name="Signups" stroke="var(--secondary)" strokeWidth={2} fill="url(#fill-signups)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
