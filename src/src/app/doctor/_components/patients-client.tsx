'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

  async function fetchPatients() {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/patients/search?q=', {
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

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <div className="bg-zinc-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Patients</h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">Manage your patients</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 max-w-md bg-white border border-zinc-200"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white border border-zinc-200">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
              <p className="text-zinc-500 text-sm">No patients found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((patient) => (
              <Card key={patient.patientId} className="bg-white border border-zinc-200">
                <CardContent className="p-4">
                  <div className="font-medium text-zinc-900">{patient.name || 'Unknown'}</div>
                  <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
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
                  <div className="text-xs text-zinc-400 mt-2">
                    {patient.totalAppointments} appointment{patient.totalAppointments !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
