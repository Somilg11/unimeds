'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

const PAGE_SIZE = 15;

export default function ClinicAdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAppointments = filteredAppointments.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Appointments</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Appointments</h1>
        <span className="text-xs font-mono uppercase text-gray-400">
          {filteredAppointments.length} total
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by patient or doctor..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 bg-white border border-gray-200"
          />
        </div>
        <div className="flex gap-px bg-gray-200 border border-gray-200">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No appointments found</p>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">Patient</th>
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden sm:table-cell">Doctor</th>
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">Date & Time</th>
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-900">{apt.patientName || '—'}</td>
                      <td className="p-3 text-sm text-gray-600 hidden sm:table-cell">{apt.doctorName || '—'}</td>
                      <td className="p-3 text-sm text-gray-600">
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
            </div>
          </div>

          {filteredAppointments.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Prev
                </button>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
