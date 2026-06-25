'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'reschedule_proposed'>('all');
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
    <div>
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

      <div className="flex gap-px bg-gray-200 border border-gray-200 mb-6 flex-wrap">
        {(['all', 'pending', 'confirmed', 'cancelled', 'reschedule_proposed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
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
        <div className="border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((apt) => (
            <div key={apt.id} className="border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{apt.patientName}</div>
                  <div className="text-xs text-gray-500 truncate">{apt.clinicName}</div>
                  {apt.notes && <div className="text-xs text-gray-400 mt-1 truncate">{apt.notes}</div>}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm text-gray-900">
                      {new Date(apt.slotTime).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
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
                      className="text-[10px] mt-1"
                    >
                      {apt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(apt.id)}
                        disabled={completingId === apt.id}
                        className="text-[11px] font-mono uppercase tracking-wider h-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                      >
                        {completingId === apt.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setRescheduleModal({ appointmentId: apt.id, patientName: apt.patientName })
                        }
                        className="text-[11px] font-mono uppercase tracking-wider h-8 border-dashed"
                      >
                        <Clock className="w-3 h-3 mr-1" />
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
          <div className="bg-white border border-gray-200 w-full max-w-md mx-4 p-6">
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
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                  New Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                  Reason (Optional)
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g., Emergency case, schedule conflict..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900 resize-none"
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
                className="flex-1 border-dashed"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!newDate || !newTime || submitting}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
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
