'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BentoCard } from './bento-card';
import { Calendar, Clock, MapPin, User, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { BookingWizardState, AppointmentSlot } from '@/types/user';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface Clinic {
  id: string;
  name: string;
  address?: string;
  settings?: {
    timezone?: string;
    bookingWindowDays?: number;
  };
}

interface Doctor {
  id: string;
  profileData?: {
    name?: string;
    specialty?: string;
  };
}

interface BookingClientProps {
  userName?: string;
}

export function BookingClient({ userName }: BookingClientProps) {
  const [wizardState, setWizardState] = useState<BookingWizardState>({
    step: 1,
  });

  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await apiClient.get('/user/clinics');
      setClinics(response.data.clinics || []);
    } catch (error) {
      console.error('Failed to fetch clinics:', error);
    } finally {
      setIsLoadingClinics(false);
    }
  };

  const fetchDoctors = async (clinicId: string) => {
    setIsLoadingDoctors(true);
    try {
      const response = await apiClient.get('/user/doctors', {
        params: { clinicId },
      });
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const fetchAvailableSlots = async (doctorId: string, date: string) => {
    setIsLoadingSlots(true);
    try {
      const response = await apiClient.get('/user/slots', {
        params: { doctorId, date }
      });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleNext = () => {
    if (wizardState.step === 1 && selectedClinic) {
      fetchDoctors(selectedClinic);
    } else if (wizardState.step === 2 && selectedDoctor) {
      // When doctor is selected, we need a date to fetch slots
      // For now, default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      fetchAvailableSlots(selectedDoctor, dateStr);
    }
    if (wizardState.step < 4) {
      setWizardState({ ...wizardState, step: wizardState.step + 1 as 1 | 2 | 3 | 4 });
    }
  };

  const handleBack = () => {
    if (wizardState.step > 1) {
      setWizardState({ ...wizardState, step: wizardState.step - 1 as 1 | 2 | 3 | 4 });
    }
  };

  const handleSubmit = async () => {
    try {
      // Construct the full ISO datetime from slot date + startTime
      const slotDateTime = selectedSlot
        ? new Date(`${selectedSlot.date}T${selectedSlot.startTime}:00`).toISOString()
        : undefined;

      await apiClient.post('/user/appointments/book', {
        clinicId: selectedClinic,
        doctorId: selectedDoctor,
        slotTime: slotDateTime,
        reason,
        notes,
      });
      toast.success('Appointment booked successfully!');
      window.location.href = '/user/dashboard';
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    }
  };

  const getStepTitle = () => {
    switch (wizardState.step) {
      case 1:
        return 'Select Clinic';
      case 2:
        return 'Choose Doctor';
      case 3:
        return 'Pick Time Slot';
      case 4:
        return 'Confirm Details';
      default:
        return 'Book Appointment';
    }
  };

  return (
    <div className="bg-zinc-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Book Appointment
              </h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">
                {getStepTitle()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  wizardState.step >= step
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {wizardState.step > step ? <Check className="w-4 h-4" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    wizardState.step > step ? 'bg-zinc-900' : 'bg-zinc-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <BentoCard className="max-w-4xl mx-auto">
          {/* Step 1: Select Clinic */}
          {wizardState.step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clinics.map((clinic) => (
                  <button
                    key={clinic.id}
                    onClick={() => {
                      setSelectedClinic(clinic.id);
                      handleNext();
                    }}
                    className={`p-6 rounded-lg border-2 text-left transition-all duration-300 ${
                      selectedClinic === clinic.id
                        ? 'border-zinc-950 bg-zinc-50'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-zinc-700" />
                      <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                        {clinic.name}
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-600">{clinic.address}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Choose Doctor */}
          {wizardState.step === 2 && (
            <div className="space-y-4">
              {isLoadingDoctors ? (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-400 mb-4" />
                  <p className="text-sm text-zinc-600">Loading doctors...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => {
                        setSelectedDoctor(doctor.id);
                        handleNext();
                      }}
                      className={`p-6 rounded-lg border-2 text-left transition-all duration-300 ${
                        selectedDoctor === doctor.id
                          ? 'border-zinc-950 bg-zinc-50'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
                          <User className="w-6 h-6 text-zinc-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                            {doctor.profileData?.name || 'Unknown Doctor'}
                          </h3>
                          <p className="text-xs text-zinc-600">{doctor.profileData?.specialty || 'General Practice'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleBack}
                className="mt-4 border-dashed"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}

          {/* Step 3: Pick Time Slot */}
          {wizardState.step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (selectedDoctor && e.target.value) {
                      fetchAvailableSlots(selectedDoctor, e.target.value);
                    }
                    setSelectedSlot(undefined);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full max-w-xs px-4 py-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>
              {isLoadingSlots ? (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-400 mb-4" />
                  <p className="text-sm text-zinc-600">Loading available slots...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      disabled={!slot.available}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-300 ${
                        selectedSlot?.id === slot.id
                          ? 'border-zinc-950 bg-zinc-50'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      } ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-zinc-700" />
                        <span className="text-sm font-semibold text-zinc-900 tracking-tight">
                          {new Date(slot.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-700" />
                        <span className="text-sm text-zinc-600">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-zinc-300 rounded-lg">
                  <Calendar className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                  <p className="text-sm text-zinc-600 font-medium">No available slots for this date</p>
                  <p className="text-xs text-zinc-500">Please select a different date</p>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-dashed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedSlot}
                  className="bg-[#0a2540] text-white hover:bg-[#003366]"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm Details */}
          {wizardState.step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
                    Reason for Visit
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Annual checkup, Follow-up, etc."
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information for the doctor..."
                    rows={4}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 resize-none"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
                <h3 className="text-sm font-semibold text-zinc-900 tracking-tight mb-4">
                  Appointment Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Clinic:</span>
                    <span className="font-medium text-zinc-900">
                      {clinics.find((c) => c.id === selectedClinic)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Doctor:</span>
                    <span className="font-medium text-zinc-900">
                      {doctors.find((d) => d.id === selectedDoctor)?.profileData?.name || 'Unknown Doctor'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Date:</span>
                    <span className="font-medium text-zinc-900">
                      {selectedSlot && new Date(selectedSlot.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Time:</span>
                    <span className="font-medium text-zinc-900">
                      {selectedSlot?.startTime} - {selectedSlot?.endTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-dashed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!reason}
                  className="bg-[#0a2540] text-white hover:bg-[#003366] flex-1"
                >
                  Confirm Booking
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </BentoCard>
      </main>
    </div>
  );
}
