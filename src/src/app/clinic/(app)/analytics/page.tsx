'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Calendar, TrendingUp, Activity } from 'lucide-react';

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
        doctorPerformance: (a.doctorPerformance || []).map((d: any) => ({
          doctorId: d.doctorId,
          name: d.doctorName || 'Unknown',
          specialization: d.specialization || '',
          totalAppointments: d.totalAppointments ?? 0,
          confirmed: d.confirmedCount ?? 0,
          cancelled: d.cancelledCount ?? 0,
        })),
        upcomingAppointments: (raw.upcomingAppointments || []).map((u: any) => ({
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
    },
    {
      label: 'This Week',
      value: analytics.summary.thisWeekAppointments,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Total Appointments',
      value: analytics.summary.totalAppointments,
      icon: BarChart3,
      color: 'text-purple-600',
    },
    {
      label: 'No-Show Rate',
      value: `${analytics.summary.noShowRate}%`,
      icon: Activity,
      color: 'text-orange-600',
    },
    {
      label: 'Total Patients',
      value: analytics.summary.totalPatients,
      icon: Users,
      color: 'text-cyan-600',
    },
    {
      label: 'Total Doctors',
      value: analytics.summary.totalDoctors,
      icon: Users,
      color: 'text-indigo-600',
    },
  ];

  const maxMonthlyCount = Math.max(...analytics.monthlyTrend.map((m) => m.count), 1);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-zinc-900 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Analytics
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-white border border-zinc-200">
              <CardHeader className="p-3">
                <CardTitle className="text-[10px] font-medium text-zinc-500 flex items-center gap-1.5">
                  <Icon className={`w-3 h-3 ${card.color}`} />
                  {card.label}
                </CardTitle>
                <div className="text-2xl font-bold text-zinc-900 mt-1">
                  {card.value}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Monthly Trend */}
      <Card className="bg-white border border-zinc-200 mb-6">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Monthly Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {analytics.monthlyTrend.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No data available</p>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {analytics.monthlyTrend.map((month) => {
                const heightPercent = (month.count / maxMonthlyCount) * 100;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-zinc-500 font-medium">{month.count}</span>
                    <div className="w-full flex justify-center" style={{ height: `${heightPercent}%` }}>
                      <div className="w-full max-w-[40px] bg-zinc-900 rounded-t-md" />
                    </div>
                    <span className="text-[10px] text-zinc-500 truncate w-full text-center">
                      {month.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Performance */}
        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Doctor Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {analytics.doctorPerformance.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="text-left p-2 text-[10px] font-medium text-zinc-500 uppercase">Doctor</th>
                      <th className="text-left p-2 text-[10px] font-medium text-zinc-500 uppercase">Specialization</th>
                      <th className="text-right p-2 text-[10px] font-medium text-zinc-500 uppercase">Total</th>
                      <th className="text-right p-2 text-[10px] font-medium text-zinc-500 uppercase">Confirmed</th>
                      <th className="text-right p-2 text-[10px] font-medium text-zinc-500 uppercase">Cancelled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.doctorPerformance.map((doc) => (
                      <tr key={doc.doctorId} className="border-b border-zinc-100 last:border-b-0">
                        <td className="p-2 text-zinc-900 font-medium">{doc.name}</td>
                        <td className="p-2 text-zinc-600">{doc.specialization}</td>
                        <td className="p-2 text-right text-zinc-900">{doc.totalAppointments}</td>
                        <td className="p-2 text-right">
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                            {doc.confirmed}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                            {doc.cancelled}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {analytics.upcomingAppointments.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-2">
                {analytics.upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-900 font-medium truncate">
                        {apt.patientName}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        {apt.doctorName}
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="text-xs text-zinc-600">
                        {new Date(apt.slotTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(apt.slotTime).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
