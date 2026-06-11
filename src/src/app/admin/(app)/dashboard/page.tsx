'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Calendar, FileText, Stethoscope, Activity, Clock } from 'lucide-react';

interface Metrics {
  totalUsers?: number;
  totalDoctors?: number;
  totalPatients?: number;
  totalClinics?: number;
  totalAppointments?: number;
  totalRecords?: number;
  recentAppointments?: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/admin/metrics');
      const raw = res.data;
      setMetrics(raw?.metrics || raw?.data?.metrics || raw?.data || raw || {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metrics';
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

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
          <button onClick={fetchMetrics} className="ml-2 text-red-400 hover:text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'Total Users', value: metrics?.totalUsers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Doctors', value: metrics?.totalDoctors ?? 0, icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Patients', value: metrics?.totalPatients ?? 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { title: 'Total Clinics', value: metrics?.totalClinics ?? 0, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Total Appointments', value: metrics?.totalAppointments ?? 0, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Total Records', value: metrics?.totalRecords ?? 0, icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Recent Appointments', value: metrics?.recentAppointments ?? 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="bg-white border border-zinc-200">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <span className="text-sm font-medium text-zinc-500">{card.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-semibold text-zinc-900">
                  {card.value.toLocaleString()}
                </div>
                {card.title === 'Recent Appointments' && (
                  <div className="text-xs text-zinc-400 mt-1">Last 30 days</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
