'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Users, Search, Phone, Mail } from 'lucide-react';

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

  useEffect(() => {
    fetchPatients();
  }, [token]);

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

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Doctor Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Patients
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your patients
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md bg-white border border-gray-200"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          {filtered.map((patient) => (
            <div key={patient.patientId} className="bg-white p-4 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">{patient.name || 'Unknown'}</div>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {patient.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> {patient.email}
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {patient.phone}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {patient.totalAppointments} appointment{patient.totalAppointments !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
