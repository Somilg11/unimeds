'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, FileText, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Appointment {
  id: string;
  slotTime: string;
  status: string;
  notes: string | null;
  patientName: string;
  clinicName: string;
}

interface DoctorDashboardClientProps {
  userName: string;
  token: string;
}

export function DoctorDashboardClient({ userName, token }: DoctorDashboardClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayApts = appointments.filter(a => new Date(a.slotTime) >= today && new Date(a.slotTime).getTime() < today.getTime() + 86400000);
  const pendingApts = appointments.filter(a => a.status === 'pending');
  const uniquePatients = new Set(appointments.map(a => a.patientName)).size;

  return (
    <div className="bg-zinc-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">
                Welcome back, {userName}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white border border-zinc-200 md:col-span-2">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                  <div className="text-2xl font-bold text-zinc-900">
                    {loading ? '-' : todayApts.length}
                  </div>
                  <div className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-1">
                    Today&apos;s Appointments
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                  <div className="text-2xl font-bold text-zinc-900">
                    {loading ? '-' : uniquePatients}
                  </div>
                  <div className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-1">
                    Total Patients
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                  <div className="text-2xl font-bold text-zinc-900">
                    {loading ? '-' : pendingApts.length}
                  </div>
                  <div className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-1">
                    Pending Requests
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-zinc-200">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                <Link href="/doctor/appointments">
                  <Button variant="ghost" className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                    <Calendar className="w-4 h-4 mr-3" />
                    View Appointments
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/doctor/patients">
                  <Button variant="ghost" className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                    <Users className="w-4 h-4 mr-3" />
                    Manage Patients
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/doctor/records">
                  <Button variant="ghost" className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                    <FileText className="w-4 h-4 mr-3" />
                    View Records
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-zinc-200 md:col-span-3">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                </div>
              ) : appointments.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">No appointments found</p>
              ) : (
                <div className="space-y-2">
                  {appointments.slice(0, 5).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-zinc-900 font-medium truncate">{apt.patientName}</div>
                        <div className="text-xs text-zinc-500 truncate">{apt.clinicName}</div>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <div className="text-xs text-zinc-600">
                          {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <Badge variant={apt.status === 'confirmed' ? 'default' : apt.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
