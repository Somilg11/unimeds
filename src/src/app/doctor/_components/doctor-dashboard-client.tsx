'use client';

import { useState, useEffect } from 'react';
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
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Doctor Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {userName}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 mb-6">
        <div className="bg-white p-5">
          <Activity className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{loading ? '-' : todayApts.length}</p>
          <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Today</p>
        </div>
        <div className="bg-white p-5">
          <Users className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{loading ? '-' : uniquePatients}</p>
          <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Patients</p>
        </div>
        <div className="bg-white p-5">
          <Calendar className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{loading ? '-' : pendingApts.length}</p>
          <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Pending</p>
        </div>
        <div className="bg-white p-5">
          <FileText className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{loading ? '-' : appointments.length}</p>
          <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Total Apts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Recent Appointments
            </p>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No appointments found</p>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium truncate">{apt.patientName}</div>
                      <div className="text-xs text-gray-500 truncate">{apt.clinicName}</div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="text-xs text-gray-600">
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
          </div>
        </div>

        <div className="border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Quick Actions
            </p>
          </div>
          <div className="p-2">
            <Link href="/doctor/appointments" className="flex items-center justify-between px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" />
                <span>View Appointments</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/doctor/patients" className="flex items-center justify-between px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Manage Patients</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/doctor/records" className="flex items-center justify-between px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>View Records</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
