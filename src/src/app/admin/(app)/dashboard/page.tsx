'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Users, Building2, Calendar, FileText, Stethoscope, Activity, Clock } from 'lucide-react';
import {
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

interface Metrics {
  totalUsers?: number;
  totalDoctors?: number;
  totalPatients?: number;
  totalClinics?: number;
  totalAppointments?: number;
  totalRecords?: number;
  recentAppointments?: number;
}

interface Clinic {
  id: string;
  name: string;
  isActive: boolean;
  doctorCount?: number;
  createdAt: string;
}

interface Doctor {
  doctorId: string;
  name: string;
  specialization: string;
  assignedClinicCount?: number;
  isActive: boolean;
}

const CHART_COLORS = {
  primary: '#111827',
  blue: '#2563eb',
  emerald: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  violet: '#7c3aed',
  cyan: '#0891b2',
  slate: '#64748b',
};

const PIE_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#dc2626', '#64748b'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white px-3 py-2 text-xs border-0">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-gray-300">
          {entry.name}: <span className="text-white font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, clinicsRes, doctorsRes] = await Promise.allSettled([
        apiClient.get('/admin/metrics'),
        apiClient.get('/admin/clinics'),
        apiClient.get('/admin/doctors'),
      ]);

      if (metricsRes.status === 'fulfilled') {
        const raw = metricsRes.value.data;
        setMetrics(raw?.metrics || raw?.data?.metrics || raw?.data || raw || {});
      }

      if (clinicsRes.status === 'fulfilled') {
        const raw = clinicsRes.value.data;
        const list = raw?.clinics || raw?.data?.clinics || raw?.data || raw || [];
        setClinics(Array.isArray(list) ? list : []);
      }

      if (doctorsRes.status === 'fulfilled') {
        const raw = doctorsRes.value.data;
        const list = raw?.doctors || raw?.data?.doctors || raw?.data || raw || [];
        setDoctors(Array.isArray(list) ? list : []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metrics';
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

  if (error) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
          <button onClick={fetchAll} className="ml-2 text-red-400 hover:text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { title: 'Total Users', value: metrics?.totalUsers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Doctors', value: metrics?.totalDoctors ?? 0, icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Patients', value: metrics?.totalPatients ?? 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { title: 'Total Clinics', value: metrics?.totalClinics ?? 0, icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Total Appointments', value: metrics?.totalAppointments ?? 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Total Records', value: metrics?.totalRecords ?? 0, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Recent Appointments', value: metrics?.recentAppointments ?? 0, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50', note: 'Last 30 days' },
  ];

  // Platform overview bar chart data
  const platformData = [
    { name: 'Doctors', count: metrics?.totalDoctors ?? 0 },
    { name: 'Patients', count: metrics?.totalPatients ?? 0 },
    { name: 'Clinics', count: metrics?.totalClinics ?? 0 },
    { name: 'Appointments', count: metrics?.totalAppointments ?? 0 },
    { name: 'Records', count: metrics?.totalRecords ?? 0 },
  ];

  // Clinic status donut data
  const activeClinics = clinics.filter((c) => c.isActive).length;
  const inactiveClinics = clinics.filter((c) => !c.isActive).length;
  const clinicStatusData = [
    { name: 'Active', value: activeClinics },
    { name: 'Inactive', value: inactiveClinics },
  ].filter((d) => d.value > 0);

  // User distribution pie data
  const userDistData = [
    { name: 'Doctors', value: metrics?.totalDoctors ?? 0 },
    { name: 'Patients', value: metrics?.totalPatients ?? 0 },
  ].filter((d) => d.value > 0);

  // Doctor specialization breakdown
  const specializationMap = new Map<string, number>();
  doctors.forEach((d) => {
    const spec = d.specialization || 'General';
    specializationMap.set(spec, (specializationMap.get(spec) || 0) + 1);
  });
  const specData = Array.from(specializationMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase text-gray-400 tracking-wider mb-1">{card.title}</p>
              <div className="text-xl font-bold text-gray-900">{card.value.toLocaleString()}</div>
              {card.note && (
                <p className="text-[10px] text-gray-400 mt-1">{card.note}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Overview Bar Chart */}
        <div className="lg:col-span-2 border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Platform Overview</h2>
            <p className="text-xs text-gray-400 mt-0.5">Entity counts across the platform</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="name"
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
                <Bar dataKey="count" name="Count" radius={[3, 3, 0, 0]} maxBarSize={50}>
                  {platformData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clinic Status Donut */}
        <div className="border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Clinic Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">Active vs inactive clinics</p>
          </div>
          <div className="p-5">
            {clinicStatusData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No clinics yet</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={clinicStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={CHART_COLORS.emerald} />
                      <Cell fill={CHART_COLORS.slate} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-emerald-600" />
                    <span className="text-xs text-gray-500">
                      Active <span className="font-medium text-gray-900">{activeClinics}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-400" />
                    <span className="text-xs text-gray-500">
                      Inactive <span className="font-medium text-gray-900">{inactiveClinics}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution Pie */}
        <div className="border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">User Distribution</h2>
            <p className="text-xs text-gray-400 mt-0.5">Doctors vs patients ratio</p>
          </div>
          <div className="p-5">
            {userDistData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No users yet</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={userDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={CHART_COLORS.blue} />
                      <Cell fill={CHART_COLORS.violet} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-5 mt-2">
                  {userDistData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5"
                        style={{ backgroundColor: i === 0 ? CHART_COLORS.blue : CHART_COLORS.violet }}
                      />
                      <span className="text-xs text-gray-500">
                        {entry.name} <span className="font-medium text-gray-900">{entry.value.toLocaleString()}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Specialization Breakdown */}
        <div className="border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Doctor Specializations</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribution by specialty</p>
          </div>
          <div className="p-5">
            {specData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No doctors yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={specData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Doctors" fill={CHART_COLORS.primary} radius={[0, 3, 3, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
