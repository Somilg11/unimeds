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
    <div className="p-4 lg:p-10">
      <div className="mb-8">
        <p className="text-[12px] font-medium uppercase text-gray-500 tracking-wider mb-2">
          Doctor Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {userName}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Activity className="w-5 h-5" />
             </div>
             <span className="text-[13px] font-medium text-gray-500">Today</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '-' : todayApts.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Users className="w-5 h-5" />
             </div>
             <span className="text-[13px] font-medium text-gray-500">Patients</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '-' : uniquePatients}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Calendar className="w-5 h-5" />
             </div>
             <span className="text-[13px] font-medium text-gray-500">Pending</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '-' : pendingApts.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <FileText className="w-5 h-5" />
             </div>
             <span className="text-[13px] font-medium text-gray-500">Total Apts</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '-' : appointments.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Recent Appointments</h2>
          </div>
          
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No appointments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-semibold truncate">{apt.patientName}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{apt.clinicName}</div>
                    </div>
                    <div className="text-right ml-3 shrink-0 flex flex-col items-end gap-1">
                      <div className="text-xs font-medium text-gray-500">
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

        <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Quick Actions</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link href="/doctor/appointments" className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-colors group hover-lift shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[13px] font-medium text-gray-900">View Appointments</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-all" />
            </Link>
            
            <Link href="/doctor/patients" className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-colors group hover-lift shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[13px] font-medium text-gray-900">Manage Patients</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-all" />
            </Link>
            
            <Link href="/doctor/records" className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-colors group hover-lift shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[13px] font-medium text-gray-900">View Records</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
