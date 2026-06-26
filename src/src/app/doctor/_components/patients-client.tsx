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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border border-gray-200"
          />
        </div>
      </div>

      <div className="border border-gray-200">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No patients found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 sm:px-4 font-mono text-[10px] uppercase text-gray-500">Patient</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-mono text-[10px] uppercase text-gray-500 hidden sm:table-cell">Contact</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-mono text-[10px] uppercase text-gray-500 hidden md:table-cell">Demographics</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-mono text-[10px] uppercase text-gray-500">Appts</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-mono text-[10px] uppercase text-gray-500 hidden lg:table-cell">Last Appointment</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((patient) => {
                    const age = getAge(patient.dateOfBirth);
                    const initials = getInitials(patient.name || 'Unknown');
                    return (
                      <tr key={patient.patientId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 sm:px-4">
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
                        <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
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
                        <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
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
                        <td className="py-3 px-3 sm:px-4 text-center">
                          <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200">
                            {patient.totalAppointments} Appt{patient.totalAppointments !== 1 ? 's' : ''}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-gray-500 text-xs hidden lg:table-cell">
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

            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
              <p className="text-xs text-gray-500">
                Page {safeCurrentPage} of {totalPages} ({filtered.length} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
