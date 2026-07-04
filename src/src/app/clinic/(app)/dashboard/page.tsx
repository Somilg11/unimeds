'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  TrendingDown,
  Activity,
  FileText,
  Clock,
} from 'lucide-react';

interface DashboardMetrics {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRecords: number;
  todayAppointments: number;
  weekAppointments: number;
}

interface Appointment {
  id: string;
  slotTime: string;
  status: string;
  patientName?: string;
  doctorName?: string;
}

export default function ClinicDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, appointmentsRes] = await Promise.allSettled([
        apiClient.get('/clinic-admin/dashboard'),
        apiClient.get('/clinic-admin/appointments'),
      ]);

      if (metricsRes.status === 'fulfilled') {
        const data = metricsRes.value.data;
        setMetrics(data?.metrics || data?.data?.metrics || {
          totalPatients: 0,
          totalDoctors: 0,
          totalAppointments: 0,
          totalRecords: 0,
          todayAppointments: 0,
          weekAppointments: 0,
        });
      }

      if (appointmentsRes.status === 'fulfilled') {
        const data = appointmentsRes.value.data;
        const appts = data?.appointments || data?.data?.appointments || [];
        setAppointments(Array.isArray(appts) ? appts : []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const todayAppts = appointments.filter((a) => {
    const d = new Date(a.slotTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const stats = [
    { label: "Today's Appointments", value: metrics?.todayAppointments ?? todayAppts.length, icon: Calendar },
    { label: 'This Week', value: metrics?.weekAppointments ?? 0, icon: Clock },
    { label: 'Total Patients', value: metrics?.totalPatients ?? 0, icon: Users },
    { label: 'Total Doctors', value: metrics?.totalDoctors ?? 0, icon: Activity },
    { label: 'Total Records', value: metrics?.totalRecords ?? 0, icon: FileText },
    { label: 'Total Appointments', value: metrics?.totalAppointments ?? 0, icon: TrendingDown },
  ];

  return (
    <div className="pb-10">
      <div className="mb-8">
        <p className="text-[12px] font-medium uppercase text-gray-500 tracking-wider mb-2">Clinic Portal</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[13px] font-medium text-gray-500">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="w-5 h-5" />
          </div>
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Recent Appointments</h2>
        </div>
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
              <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No appointments yet</p>
            </div>
          ) : (
            appointments.slice(0, 10).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {apt.patientName || 'Patient'}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {apt.doctorName || 'Doctor'}
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0 flex flex-col items-end gap-1">
                  <div className="text-xs font-medium text-gray-500">
                    {new Date(apt.slotTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Badge
                    variant={apt.status === 'confirmed' ? 'default' : apt.status === 'cancelled' ? 'destructive' : 'secondary'}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
