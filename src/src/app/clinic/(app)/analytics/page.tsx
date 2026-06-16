'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
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
    },
    {
      label: 'This Week',
      value: analytics.summary.thisWeekAppointments,
      icon: TrendingUp,
    },
    {
      label: 'Total Appointments',
      value: analytics.summary.totalAppointments,
      icon: BarChart3,
    },
    {
      label: 'No-Show Rate',
      value: `${analytics.summary.noShowRate}%`,
      icon: Activity,
    },
    {
      label: 'Total Patients',
      value: analytics.summary.totalPatients,
      icon: Users,
    },
    {
      label: 'Total Doctors',
      value: analytics.summary.totalDoctors,
      icon: Users,
    },
  ];

  const maxMonthlyCount = Math.max(...analytics.monthlyTrend.map((m) => m.count), 1);

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
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-gray-200 border border-gray-200 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">{card.label}</span>
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Monthly Trend */}
      <div className="border border-gray-200 mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Monthly Trend
          </h2>
        </div>
        <div className="p-4">
          {analytics.monthlyTrend.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {analytics.monthlyTrend.map((month) => {
                const heightPercent = (month.count / maxMonthlyCount) * 100;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">{month.count}</span>
                    <div className="w-full flex justify-center" style={{ height: `${heightPercent}%` }}>
                      <div className="w-full max-w-[40px] bg-gray-900" />
                    </div>
                    <span className="text-[10px] text-gray-500 truncate w-full text-center">
                      {month.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Performance */}
        <div className="border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Doctor Performance
            </h2>
          </div>
          <div>
            {analytics.doctorPerformance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-[10px] font-mono uppercase text-gray-400">Doctor</th>
                      <th className="text-left p-3 text-[10px] font-mono uppercase text-gray-400 hidden sm:table-cell">Specialization</th>
                      <th className="text-right p-3 text-[10px] font-mono uppercase text-gray-400">Total</th>
                      <th className="text-right p-3 text-[10px] font-mono uppercase text-gray-400">Confirmed</th>
                      <th className="text-right p-3 text-[10px] font-mono uppercase text-gray-400">Cancelled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.doctorPerformance.map((doc) => (
                      <tr key={doc.doctorId} className="border-b border-gray-100 last:border-b-0">
                        <td className="p-3 text-gray-900 font-medium">{doc.name}</td>
                        <td className="p-3 text-gray-600 hidden sm:table-cell">{doc.specialization}</td>
                        <td className="p-3 text-right text-gray-900">{doc.totalAppointments}</td>
                        <td className="p-3 text-right">
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                            {doc.confirmed}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
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
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Upcoming Appointments
            </h2>
          </div>
          <div>
            {analytics.upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No upcoming appointments</p>
            ) : (
              <div>
                {analytics.upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium truncate">
                        {apt.patientName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {apt.doctorName}
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="text-xs text-gray-600">
                        {new Date(apt.slotTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(apt.slotTime).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
