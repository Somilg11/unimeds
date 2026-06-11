'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface Appointment {
  id: string;
  slotTime: string;
  status: string;
  notes: string | null;
  patientName: string;
  clinicName: string;
}

interface AppointmentsClientProps {
  userName: string;
  token: string;
}

export function AppointmentsClient({ userName, token }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/appointments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="bg-zinc-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Appointments</h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">Manage your schedule</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                filter === f ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white border border-zinc-200">
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
              <p className="text-zinc-500 text-sm">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((apt) => (
              <Card key={apt.id} className="bg-white border border-zinc-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">{apt.patientName}</div>
                      <div className="text-xs text-zinc-500 truncate">{apt.clinicName}</div>
                      {apt.notes && <div className="text-xs text-zinc-400 mt-1 truncate">{apt.notes}</div>}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className="text-sm text-zinc-900">
                        {new Date(apt.slotTime).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <Badge
                        variant={apt.status === 'confirmed' ? 'default' : apt.status === 'cancelled' ? 'destructive' : 'secondary'}
                        className="text-[10px] mt-1"
                      >
                        {apt.status}
                      </Badge>
                    </div>
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
