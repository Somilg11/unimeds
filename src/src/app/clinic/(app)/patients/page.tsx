'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Search, Calendar, Phone, Mail, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface Patient {
  patientId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  lastAppointment: string | null;
  totalAppointments: number;
}

const PAGE_SIZE = 15;

export default function ClinicAdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  async function fetchPatients() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/clinic-admin/patients');
      const raw = res.data;
      const patientsList = raw?.patients || raw?.data?.patients || raw?.data || raw || [];
      setPatients(Array.isArray(patientsList) ? patientsList : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch patients';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPatients = filteredPatients.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function getInitials(name: string) {
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'P'
    );
  }

  function getAge(dobString?: string) {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} yrs`;
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Patients</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Patients</h1>
        <div className="border border-gray-200 p-6">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchPatients}
            className="mt-2 text-sm text-gray-900 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[12px] font-medium uppercase text-gray-500 tracking-wider mb-2">Clinic Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Patients</h1>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#36565F] bg-[#E2F0F0]/50 px-3 py-1.5 rounded-full border border-[#E2F0F0]">
          {patients.length} total
        </span>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 bg-white/50 border-gray-200 rounded-xl focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all shadow-sm"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-100 border-dashed rounded-3xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-gray-900 mb-1">No patients found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Demographics</th>
                    <th className="px-5 py-4 text-center text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Appts</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Last Appointment</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((patient) => {
                    const age = getAge(patient.dateOfBirth);
                    const initials = getInitials(patient.name || 'Unknown');
                    return (
                      <tr key={patient.patientId} className="border-b border-gray-100/80 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E2F0F0]/80 text-[#36565F] font-semibold text-sm flex items-center justify-center shrink-0 border border-[#E2F0F0]">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-[14px] text-gray-900">{patient.name || 'Unknown'}</div>
                              <div className="text-[13px] text-gray-500 sm:hidden mt-0.5">{patient.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <div className="space-y-1">
                            {patient.email && (
                              <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                                <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{patient.email}</span>
                              </div>
                            )}
                            {patient.phone && (
                              <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                                <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>{patient.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            {patient.gender && (
                              <Badge variant="secondary" className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 capitalize">
                                {patient.gender}
                              </Badge>
                            )}
                            {age && (
                              <Badge variant="secondary" className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                {age}
                              </Badge>
                            )}
                          </div>
                          {patient.dateOfBirth && (
                            <div className="text-[11px] text-gray-400 mt-1.5">
                              DOB: {new Date(patient.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge variant="secondary" className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#E2F0F0]/80 text-[#36565F] border border-[#E2F0F0]">
                            {patient.totalAppointments} Appt{patient.totalAppointments !== 1 ? 's' : ''}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-[13px] hidden lg:table-cell">
                          {patient.lastAppointment ? (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>{new Date(patient.lastAppointment).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No appointments</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredPatients.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-6 px-1">
              <p className="text-[13px] font-medium text-gray-500">
                Page {safePage} of {totalPages} ({filteredPatients.length} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl h-9 px-4 text-[12px] font-medium border-gray-200 shadow-sm"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl h-9 px-4 text-[12px] font-medium border-gray-200 shadow-sm"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
