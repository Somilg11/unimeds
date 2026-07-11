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
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[12px] font-medium uppercase text-gray-500 tracking-wider mb-2">Clinic Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Appointments</h1>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#36565F] bg-[#E2F0F0]/50 px-3 py-1.5 rounded-full border border-[#E2F0F0]">
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by patient or doctor..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 h-10 bg-white/50 border-gray-200 rounded-xl focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all shadow-sm"
          />
        </div>
        <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-100 self-start w-fit">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-white text-[#36565F] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-100 border-dashed rounded-3xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-gray-900 mb-1">No appointments found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Doctor</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-100/80 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-[14px] text-gray-900 font-medium whitespace-nowrap">{apt.patientName || '—'}</td>
                      <td className="px-5 py-4 text-[13px] text-gray-600 whitespace-nowrap hidden sm:table-cell">{apt.doctorName || '—'}</td>
                      <td className="px-5 py-4 text-[13px] text-gray-600 whitespace-nowrap">
                        {new Date(apt.slotTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            apt.status === 'confirmed'
                              ? 'default'
                              : apt.status === 'cancelled'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredAppointments.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-6 px-1">
              <p className="text-[13px] font-medium text-gray-500">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl h-9 px-4 text-[12px] font-medium border border-gray-200 shadow-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </button>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-xl h-9 px-4 text-[12px] font-medium border border-gray-200 shadow-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
