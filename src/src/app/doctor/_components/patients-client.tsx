'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Phone, Mail, Calendar, User, Clock, Loader2 } from 'lucide-react';

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

  async function fetchPatients(query?: string) {
    try {
      setLoading(true);
      const url = query ? `/api/doctor/patients/search?q=${encodeURIComponent(query)}` : '/api/doctor/patients/search';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
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
    ? patients.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search)
      )
    : patients;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'P';
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

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedPatients = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <p className="text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
            Doctor Portal
          </p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            My Patients
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Overview of patients and appointments under your care
          </p>
        </div>

        <div className="relative mt-4 md:mt-0 w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full bg-white border border-gray-200 text-xs rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-16 text-center bg-white shadow-sm">
          <Users className="mx-auto h-10 w-10 text-gray-300 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">No patients</h3>
          <p className="text-gray-500 text-xs mt-1">No patients found matching your search.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-mono uppercase text-gray-400 tracking-wider">
                  <th className="p-4 font-medium">Patient</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium">Demographics</th>
                  <th className="p-4 font-medium text-center">Total Appts</th>
                  <th className="p-4 font-medium">Last Appointment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {paginatedPatients.map((patient) => {
                  const age = getAge(patient.dateOfBirth);
                  const initials = getInitials(patient.name || 'Unknown');
                  return (
                    <tr key={patient.patientId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="font-semibold text-gray-900">
                            {patient.name || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        {patient.email && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{patient.email}</span>
                          </div>
                        )}
                        {patient.phone && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{patient.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 space-y-1">
                        {patient.gender && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 capitalize">
                            {patient.gender}
                          </span>
                        )}
                        {age && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 ml-1.5">
                            {age}
                          </span>
                        )}
                        {patient.dateOfBirth && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            DOB: {new Date(patient.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-full">
                          {patient.totalAppointments} Appt{patient.totalAppointments !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {patient.lastAppointment ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">
                  {Math.min(currentPage * itemsPerPage, filtered.length)}
                </span>{' '}
                of <span className="font-semibold text-gray-900">{filtered.length}</span> patients
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-xs h-8 px-3 border-gray-200 bg-white"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`text-xs h-8 w-8 p-0 ${
                      currentPage === i + 1 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-xs h-8 px-3 border-gray-200 bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
