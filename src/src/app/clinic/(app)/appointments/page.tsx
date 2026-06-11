'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotTime: string;
  status: string;
  notes?: string;
  patientName?: string;
  doctorName?: string;
  createdAt: string;
}

export default function ClinicAdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/clinic-admin/appointments');
      const raw = res.data;
      const appts = raw?.appointments || raw?.data?.appointments || raw?.data || raw || [];
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch appointments';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      apt.patientName?.toLowerCase().includes(query) ||
      apt.doctorName?.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Appointments</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Appointments
        </h1>
        <Badge variant="secondary" className="text-xs w-fit">
          {filteredAppointments.length} total
        </Badge>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search by patient or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border border-zinc-200"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                statusFilter === status
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No appointments found</p>
        </div>
      ) : (
        <Card className="bg-white border border-zinc-200">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left p-3 text-xs font-semibold text-zinc-600">Patient</th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-600">Doctor</th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-600">Date & Time</th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50">
                    <td className="p-3 text-sm text-zinc-900">{apt.patientName || '—'}</td>
                    <td className="p-3 text-sm text-zinc-600">{apt.doctorName || '—'}</td>
                    <td className="p-3 text-sm text-zinc-600">
                      {new Date(apt.slotTime).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          apt.status === 'confirmed'
                            ? 'default'
                            : apt.status === 'cancelled'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {apt.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
