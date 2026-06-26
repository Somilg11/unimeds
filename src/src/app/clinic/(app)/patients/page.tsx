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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Patients</h1>
        <span className="text-xs font-mono uppercase text-gray-400">
          {patients.length} total
        </span>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border border-gray-200"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No patients found</p>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">Patient</th>
                    <th className="text-left px-4 py-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden sm:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden md:table-cell">Demographics</th>
                    <th className="text-center px-4 py-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">Appts</th>
                    <th className="text-left px-4 py-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden lg:table-cell">Last Appointment</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((patient) => {
                    const age = getAge(patient.dateOfBirth);
                    const initials = getInitials(patient.name || 'Unknown');
                    return (
                      <tr key={patient.patientId} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 text-gray-600 font-semibold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{patient.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500 sm:hidden mt-0.5">{patient.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
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
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            {patient.gender && (
                              <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 capitalize">
                                {patient.gender}
                              </Badge>
                            )}
                            {age && (
                              <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                                {age}
                              </Badge>
                            )}
                          </div>
                          {patient.dateOfBirth && (
                            <div className="text-[10px] text-gray-400 mt-1">
                              DOB: {new Date(patient.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200">
                            {patient.totalAppointments} Appt{patient.totalAppointments !== 1 ? 's' : ''}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                          {patient.lastAppointment ? (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{new Date(patient.lastAppointment).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No appointments</span>
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
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                Page {safePage} of {totalPages} ({filteredPatients.length} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
