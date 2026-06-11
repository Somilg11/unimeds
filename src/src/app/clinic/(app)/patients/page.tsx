'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Calendar, Phone, Mail } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastAppointmentDate: string | null;
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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Patients</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Patients</h1>
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchPatients}
            className="mt-2 text-sm text-zinc-900 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Patients
        </h1>
        <Badge variant="secondary" className="w-fit text-xs">
          {patients.length} total
        </Badge>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md bg-white border border-zinc-200"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <Users className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="bg-white border border-zinc-200">
              <CardHeader className="p-4">
                <CardTitle className="text-base font-semibold text-zinc-900">
                  {patient.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{patient.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{patient.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    Last:{' '}
                    {patient.lastAppointmentDate
                      ? new Date(patient.lastAppointmentDate).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-100">
                  <Badge variant="outline" className="text-xs">
                    {patient.totalAppointments ?? 0} appointment
                    {(patient.totalAppointments ?? 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
