'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Calendar, TrendingUp, Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AnalyticsSummary {
  todaysAppointments: number;
  thisWeekAppointments: number;
  totalAppointments: number;
  noShowRate: number;
  totalPatients: number;
  totalDoctors: number;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface DoctorPerformance {
  doctorId: string;
  name: string;
  specialization: string;
  totalAppointments: number;
  confirmed: number;
  cancelled: number;
}

interface UpcomingAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  slotTime: string;
  status: string;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  monthlyTrend: MonthlyData[];
  doctorPerformance: DoctorPerformance[];
  upcomingAppointments: UpcomingAppointment[];
}

const emptySummary: AnalyticsSummary = {
  todaysAppointments: 0,
  thisWeekAppointments: 0,
  totalAppointments: 0,
  noShowRate: 0,
  totalPatients: 0,
  totalDoctors: 0,
};

const CHART_COLORS = {
  primary: '#111827',
  primaryLight: '#6b7280',
  confirmed: '#059669',
  confirmedLight: '#d1fae5',
  cancelled: '#dc2626',
  cancelledLight: '#fee2e2',
  pending: '#d97706',
  pendingLight: '#fef3c7',
  accent: '#2563eb',
  accentLight: '#dbeafe',
  purple: '#7c3aed',
  purpleLight: '#ede9fe',
  cyan: '#0891b2',
  cyanLight: '#cffafe',
};

const STATUS_COLORS = ['#059669', '#dc2626', '#d97706', '#6b7280'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white px-3 py-2 text-xs border-0">
      <p className="font-medium mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-gray-300">
          {entry.name}: <span className="text-white font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function ClinicAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    summary: emptySummary,
    monthlyTrend: [],
    doctorPerformance: [],
    upcomingAppointments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/clinic-admin/analytics');
      const raw = res.data?.data || res.data || {};
      const a = raw.analytics || {};
      setAnalytics({
        summary: {
          todaysAppointments: a.todayAppointments ?? 0,
          thisWeekAppointments: a.weekAppointments ?? 0,
          totalAppointments: a.totalAppointments ?? 0,
          noShowRate: parseFloat(a.noShowRate ?? '0'),
          totalPatients: a.totalPatients ?? 0,
          totalDoctors: a.totalDoctors ?? 0,
        },
        monthlyTrend: a.monthlyTrend || [],
        doctorPerformance: (a.doctorPerformance || []).map((
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          d: any
        ) => ({
          doctorId: d.doctorId,
          name: d.doctorName || 'Unknown',
          specialization: d.specialization || '',
          totalAppointments: d.totalAppointments ?? 0,
          confirmed: d.confirmedCount ?? 0,
          cancelled: d.cancelledCount ?? 0,
        })),
        upcomingAppointments: (raw.upcomingAppointments || []).map((
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          u: any
        ) => ({
          id: u.id,
          patientName: u.patientName || 'Unknown',
          doctorName: '',
          slotTime: u.slotTime,
          status: u.status,
        })),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const summaryCards = [
    {
      label: "Today's Appointments",
      value: analytics.summary.todaysAppointments,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'This Week',
      value: analytics.summary.thisWeekAppointments,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Appointments',
      value: analytics.summary.totalAppointments,
      icon: BarChart3,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'No-Show Rate',
      value: `${analytics.summary.noShowRate}%`,
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Total Patients',
      value: analytics.summary.totalPatients,
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      label: 'Total Doctors',
      value: analytics.summary.totalDoctors,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  const appointmentStatusData = analytics.doctorPerformance.reduce(
    (acc, doc) => {
      acc.confirmed += doc.confirmed;
      acc.cancelled += doc.cancelled;
      return acc;
    },
    { confirmed: 0, cancelled: 0 }
  );

  const donutData = [
    { name: 'Confirmed', value: appointmentStatusData.confirmed },
    { name: 'Cancelled', value: appointmentStatusData.cancelled },
  ].filter((d) => d.value > 0);

  const monthlyChartData = analytics.monthlyTrend.map((m) => ({
    ...m,
    month: m.month.length > 7 ? m.month.slice(5) : m.month,
  }));

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Analytics</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Analytics</h1>
        <div className="border border-gray-200 p-6">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-gray-900 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="mb-8">
        <p className="text-[12px] font-medium uppercase text-gray-500 tracking-wider mb-2">Clinic Portal</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-2xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-[12px] font-medium text-gray-500 mb-1">{card.label}</p>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Monthly Trend - Area Chart */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Monthly Appointment Trend</h2>
          <p className="text-[13px] text-gray-500 mt-1">Appointments over the last 6 months</p>
        </div>
        <div className="p-5">
          {monthlyChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No trend data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Appointments"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Performance - Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Doctor Performance</h2>
            <p className="text-[13px] text-gray-500 mt-1">Confirmed vs cancelled appointments per doctor</p>
          </div>
          <div className="p-5">
            {analytics.doctorPerformance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={analytics.doctorPerformance}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="square"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                  <Bar
                    dataKey="confirmed"
                    name="Confirmed"
                    fill={CHART_COLORS.confirmed}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    fill={CHART_COLORS.cancelled}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Appointment Status - Donut Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Appointment Status</h2>
            <p className="text-[13px] text-gray-500 mt-1">Overall breakdown</p>
          </div>
          <div className="p-5">
            {donutData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No data available</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2">
                  {donutData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5"
                        style={{ backgroundColor: STATUS_COLORS[i] }}
                      />
                      <span className="text-xs text-gray-500">
                        {entry.name} <span className="font-medium text-gray-900">{entry.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Upcoming Appointments</h2>
          <p className="text-[13px] text-gray-500 mt-1">Next scheduled visits</p>
        </div>
        <div>
          {analytics.upcomingAppointments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming appointments</p>
          ) : (
            analytics.upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between px-6 py-4 border-b border-gray-100/80 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E2F0F0]/80 border border-[#E2F0F0] flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-bold text-[#36565F]">
                      {apt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-gray-900 truncate">{apt.patientName}</p>
                    <p className="text-[13px] text-gray-500">
                      {new Date(apt.slotTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(apt.slotTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    apt.status === 'confirmed'
                      ? 'default'
                      : apt.status === 'cancelled'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                    apt.status === 'confirmed'
                      ? 'bg-[#E2F0F0]/80 text-[#36565F] border-[#E2F0F0]'
                      : apt.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : apt.status === 'cancelled'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {apt.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
