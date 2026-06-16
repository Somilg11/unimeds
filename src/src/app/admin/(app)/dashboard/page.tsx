'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
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
      <div className="p-4 lg:p-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-6">Dashboard</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-6">Dashboard</h1>
        <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
          <button onClick={fetchMetrics} className="ml-2 text-red-400 hover:text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'Total Users', value: metrics?.totalUsers ?? 0, icon: Users, color: 'text-blue-600' },
    { title: 'Total Doctors', value: metrics?.totalDoctors ?? 0, icon: Stethoscope, color: 'text-blue-600' },
    { title: 'Total Patients', value: metrics?.totalPatients ?? 0, icon: Users, color: 'text-blue-600' },
    { title: 'Total Clinics', value: metrics?.totalClinics ?? 0, icon: Building2, color: 'text-blue-600' },
    { title: 'Total Appointments', value: metrics?.totalAppointments ?? 0, icon: Calendar, color: 'text-blue-600' },
    { title: 'Total Records', value: metrics?.totalRecords ?? 0, icon: FileText, color: 'text-blue-600' },
    { title: 'Recent Appointments', value: metrics?.recentAppointments ?? 0, icon: Clock, color: 'text-blue-600', note: 'Last 30 days' },
  ];

  return (
    <div className="p-4 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-5 h-5 text-gray-400" />
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-4">
              <p className="font-mono text-[10px] uppercase text-gray-500 mb-2">{card.title}</p>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-2xl font-black tracking-tight text-gray-900">
                  {card.value.toLocaleString()}
                </span>
              </div>
              {card.note && (
                <p className="text-[10px] text-gray-400 mt-1">{card.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
