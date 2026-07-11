'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Phone, Mail, Calendar, User, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Patient {
  patientId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  lastAppointment: string;
  totalAppointments: number;
}

interface PatientsClientProps {
  userName: string;
  token: string;
}

export function PatientsClient({ userName, token }: PatientsClientProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchPatients();
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  async function fetchPatients() {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/patients/search', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const filtered = search
    ? patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search)
    )
    : patients;

  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'P'
    );
  };

  const getAge = (dobString: string) => {
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
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPatients = filtered.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-6">My Patients</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
            Doctor Portal
          </p>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Patients</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Overview of patients and appointments under your care
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white/50 border-gray-200 rounded-xl focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {filtered.length === 0 ? (
          <div className="p-16 text-center bg-gray-50/50 border-b border-gray-100">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[15px] font-semibold text-gray-900 mb-1">No patients found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Demographics</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-center text-gray-500 uppercase tracking-wider">Appts</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Last Appointment</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((patient) => {
                    const age = getAge(patient.dateOfBirth);
                    const initials = getInitials(patient.name || 'Unknown');
                    return (
                      <tr key={patient.patientId} className="border-b border-gray-100/80 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E2F0F0] text-[#36565F] font-semibold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{patient.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500 sm:hidden mt-0.5">{patient.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <div className="space-y-1">
                            {patient.email && (
                              <div className="flex items-center gap-1.5 text-gray-600 text-[13px]">
                                <Mail className="w-3.5 h-3.5 text-[#36565F]/60 shrink-0" />
                                <span className="truncate max-w-[180px]">{patient.email}</span>
                              </div>
                            )}
                            {patient.phone && (
                              <div className="flex items-center gap-1.5 text-gray-600 text-[13px]">
                                <Phone className="w-3.5 h-3.5 text-[#36565F]/60 shrink-0" />
                                <span>{patient.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            {patient.gender && (
                              <Badge variant="secondary" className="text-[11px] font-medium bg-[#E2F0F0]/50 text-[#36565F] border border-[#E2F0F0] capitalize rounded-full px-2.5 py-0.5">
                                {patient.gender}
                              </Badge>
                            )}
                            {age && (
                              <Badge variant="secondary" className="text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5">
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
                          <Badge variant="secondary" className="text-[11px] font-medium bg-[#E2F0F0]/50 text-[#36565F] border border-[#E2F0F0] rounded-full px-2.5 py-0.5">
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

            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50 gap-2">
              <p className="text-[13px] font-medium text-gray-500">
                Page {safeCurrentPage} of {totalPages} ({filtered.length} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 px-3 text-[12px] font-medium border-gray-200 shadow-sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 px-3 text-[12px] font-medium border-gray-200 shadow-sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
