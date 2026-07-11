'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'reschedule_proposed' | 'completed'>('all');
  const [rescheduleModal, setRescheduleModal] = useState<{ appointmentId: string; patientName: string } | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/appointments', {
        headers: { Authorization: `Bearer ${token}` },
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

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const handleReschedule = async () => {
    if (!rescheduleModal || !newDate || !newTime) return;

    setSubmitting(true);
    try {
      const proposedTime = new Date(`${newDate}T${newTime}:00`).toISOString();
      const res = await fetch(`/api/doctor/appointments/${rescheduleModal.appointmentId}/reschedule`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposedTime,
          reason: rescheduleReason || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Reschedule proposal sent to patient');
        setRescheduleModal(null);
        setNewDate('');
        setNewTime('');
        setRescheduleReason('');
        fetchAppointments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to propose reschedule');
      }
    } catch {
      toast.error('Failed to propose reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (appointmentId: string) => {
    setCompletingId(appointmentId);
    try {
      const res = await fetch(`/api/doctor/appointments/${appointmentId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        toast.success('Appointment marked as completed');
        fetchAppointments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to complete appointment');
      }
    } catch {
      toast.error('Failed to complete appointment');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-10">
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Doctor Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Appointments
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your schedule
        </p>
      </div>

      <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-100 mb-6 flex-wrap self-start w-fit">
        {(['all', 'pending', 'confirmed', 'cancelled', 'reschedule_proposed', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-[13px] font-medium capitalize rounded-lg transition-all ${filter === f ? 'bg-white text-[#36565F] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-gray-100 bg-gray-50/50 rounded-3xl border-dashed">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-[15px] font-semibold text-gray-900 mb-1">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-gray-900 truncate">{apt.patientName}</div>
                  <div className="text-[13px] text-gray-500 truncate mt-0.5">{apt.clinicName}</div>
                  {apt.notes && <div className="text-[12px] text-gray-400 mt-1.5 truncate">{apt.notes}</div>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right mr-2">
                    <div className="text-[14px] font-medium text-gray-900">
                      {new Date(apt.slotTime).toLocaleDateString()}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <Badge
                      variant={
                        apt.status === 'confirmed'
                          ? 'default'
                          : apt.status === 'cancelled'
                            ? 'destructive'
                            : apt.status === 'reschedule_proposed'
                              ? 'outline'
                              : 'secondary'
                      }
                      className="text-[11px] font-medium mt-1.5 rounded-full px-2.5 py-0.5"
                    >
                      {apt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(apt.id)}
                        disabled={completingId === apt.id}
                        className="rounded-xl h-9 px-3 text-[12px] font-medium border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 shadow-sm"
                      >
                        {completingId === apt.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setRescheduleModal({ appointmentId: apt.id, patientName: apt.patientName })
                        }
                        className="rounded-xl h-9 px-3 text-[12px] font-medium border-dashed shadow-sm hover:bg-gray-50"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        Reschedule
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-xl w-full max-w-md mx-4 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Propose Reschedule</h2>
              <button
                onClick={() => {
                  setRescheduleModal(null);
                  setNewDate('');
                  setNewTime('');
                  setRescheduleReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Propose a new time for <span className="font-medium text-gray-900">{rescheduleModal.patientName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                  New Date
                </label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-white border border-gray-200 rounded-xl h-10 px-4 focus:border-primary/30 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                  New Time
                </label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl h-10 px-4 focus:border-primary/30 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                  Reason (Optional)
                </label>
                <Textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g., Emergency case, schedule conflict..."
                  rows={3}
                  className="bg-white border border-gray-200 rounded-xl p-3 focus:border-primary/30 focus:ring-primary/20 transition-all shadow-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setRescheduleModal(null);
                  setNewDate('');
                  setNewTime('');
                  setRescheduleReason('');
                }}
                className="flex-1 rounded-xl border-dashed border-gray-200 shadow-sm h-10 hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!newDate || !newTime || submitting}
                className="flex-1 rounded-xl bg-gray-900 text-white hover:bg-gray-800 shadow-sm h-10"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 mr-2" />
                )}
                Propose
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
