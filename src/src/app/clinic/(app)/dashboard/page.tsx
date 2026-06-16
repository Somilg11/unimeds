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
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Appointments */}
      <div className="border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Recent Appointments</h2>
        </div>
        <div>
          {appointments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No appointments yet</p>
          ) : (
            appointments.slice(0, 10).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {apt.patientName || 'Patient'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {apt.doctorName || 'Doctor'}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-600">
                    {new Date(apt.slotTime).toLocaleString()}
                  </div>
                  <Badge
                    variant={apt.status === 'confirmed' ? 'default' : apt.status === 'cancelled' ? 'destructive' : 'secondary'}
                    className="text-[10px]"
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
