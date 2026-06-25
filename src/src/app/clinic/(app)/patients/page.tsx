'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Users, Search, Calendar, Phone, Mail } from 'lucide-react';

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

export default function ClinicAdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

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
      patient.email?.toLowerCase().includes(query)
    );
  });

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

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md bg-white border border-gray-200"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          {filteredPatients.map((patient) => (
            <div key={patient.patientId} className="bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{patient.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{patient.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{patient.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Last:{' '}
                    {patient.lastAppointment
                      ? new Date(patient.lastAppointment).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-xs font-mono uppercase text-gray-400">
                    {patient.totalAppointments ?? 0} appointment
                    {(patient.totalAppointments ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
