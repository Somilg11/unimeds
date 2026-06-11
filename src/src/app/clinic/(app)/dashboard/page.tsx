'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  TrendingDown,
  Activity,
  FileText,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const todayAppts = appointments.filter((a) => {
    const d = new Date(a.slotTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Today&apos;s Appointments
            </CardTitle>
            <div className="text-3xl font-bold text-zinc-900">
              {metrics?.todayAppointments ?? todayAppts.length}
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              This Week
            </CardTitle>
            <div className="text-3xl font-bold text-zinc-900">
              {metrics?.weekAppointments ?? 0}
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Patients
            </CardTitle>
            <div className="text-3xl font-bold text-zinc-900">
              {metrics?.totalPatients ?? 0}
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Doctors
            </CardTitle>
            <div className="text-3xl font-bold text-zinc-900">
              {metrics?.totalDoctors ?? 0}
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Records
            </CardTitle>
            <div className="text-3xl font-bold text-zinc-900">
              {metrics?.totalRecords ?? 0}
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Total Appointments
            </CardTitle>
            <div className="text-3xl font-bold text-zinc-900">
              {metrics?.totalAppointments ?? 0}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card className="bg-white border border-zinc-200">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {appointments.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">No appointments yet</p>
          ) : (
            <div className="space-y-2">
              {appointments.slice(0, 10).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 truncate">
                      {apt.patientName || 'Patient'}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {apt.doctorName || 'Doctor'}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-zinc-600">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
