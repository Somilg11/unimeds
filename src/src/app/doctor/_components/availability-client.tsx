'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AvailabilitySlot {
  id: string;
  doctorId: string;
  clinicId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Clinic {
  id: string;
  name: string;
}

interface AvailabilityClientProps {
  userName: string;
  token: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityClient({ userName, token }: AvailabilityClientProps) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<Record<number, { startTime: string; endTime: string }[]>>({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
  });

  useEffect(() => {
    fetchClinics();
  }, [token]);

  useEffect(() => {
    if (selectedClinic) {
      fetchAvailability();
    }
  }, [selectedClinic, token]);

  async function fetchClinics() {
    try {
      const res = await fetch('/api/doctor/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const clinicMap = new Map<string, Clinic>();
        (data.appointments || []).forEach((apt: any) => {
          if (apt.clinicName && apt.clinicId) {
            clinicMap.set(apt.clinicId, { id: apt.clinicId, name: apt.clinicName });
          }
        });
        setClinics(Array.from(clinicMap.values()));
        if (clinicMap.size === 1) {
          setSelectedClinic(Array.from(clinicMap.keys())[0]);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailability() {
    try {
      const res = await fetch('/api/doctor/availability', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const slots = (data.availability || []).filter(
          (s: AvailabilitySlot) => s.clinicId === selectedClinic
        );
        setAvailability(slots);

        const newSchedule: Record<number, { startTime: string; endTime: string }[]> = {
          0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
        };
        slots.forEach((slot: AvailabilitySlot) => {
          newSchedule[slot.dayOfWeek].push({
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        });
        setSchedule(newSchedule);
      }
    } catch {
      // ignore
    }
  }

  const addTimeSlot = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { startTime: '09:00', endTime: '17:00' }],
    }));
  };

  const removeTimeSlot = (day: number, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (day: number, index: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allSlots = Object.entries(schedule).flatMap(([day, slots]) =>
        slots.map((s) => ({
          dayOfWeek: parseInt(day),
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      );

      const res = await fetch('/api/doctor/availability', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId: selectedClinic,
          schedule: allSlots,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAvailability(data.availability || []);
        toast.success('Availability schedule saved');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save schedule');
      }
    } catch {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Doctor Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Availability
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Set your weekly schedule for each clinic
        </p>
      </div>

      {clinics.length > 1 && (
        <div className="mb-6">
          <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
            Select Clinic
          </label>
          <div className="flex gap-2">
            {clinics.map((clinic) => (
              <button
                key={clinic.id}
                onClick={() => setSelectedClinic(clinic.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedClinic === clinic.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {clinic.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedClinic && (
        <div className="space-y-4">
          {DAYS.map((day, dayIndex) => (
            <div key={dayIndex} className="border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">{day}</h3>
                <button
                  onClick={() => addTimeSlot(dayIndex)}
                  className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Slot
                </button>
              </div>

              {schedule[dayIndex].length === 0 ? (
                <p className="text-xs text-gray-400 italic">No availability set</p>
              ) : (
                <div className="space-y-2">
                  {schedule[dayIndex].map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-3">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      />
                      <button
                        onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Schedule
            </Button>
          </div>
        </div>
      )}

      {!selectedClinic && clinics.length === 0 && (
        <div className="border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">
            No clinics found. Please contact your clinic admin.
          </p>
        </div>
      )}
    </div>
  );
}
