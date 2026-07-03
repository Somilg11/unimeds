'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BentoCard } from './bento-card';
import { Calendar, Clock, MapPin, User, Check, ChevronRight, ChevronLeft, Loader2, Navigation } from 'lucide-react';
import { BookingWizardState, AppointmentSlot } from '@/types/user';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface Clinic {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number;
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
    specialization?: string;
  };
}

interface DoctorSearchResult {
  id: string;
  profileData?: {
    name?: string;
    specialization?: string;
  };
  clinics: Array<{
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
  }>;
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
  const [searchMode, setSearchMode] = useState<'all' | 'nearby'>('all');
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);

  // Doctor search state
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [doctorSearchResults, setDoctorSearchResults] = useState<DoctorSearchResult[]>([]);
  const [isSearchingDoctors, setIsSearchingDoctors] = useState(false);
  const [searchTab, setSearchTab] = useState<'clinic' | 'doctor'>('clinic');
  const [selectedDoctorFromSearch, setSelectedDoctorFromSearch] = useState<DoctorSearchResult | null>(null);

  // Clinic search state
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [isSearchingClinics, setIsSearchingClinics] = useState(false);

  const { latitude, longitude, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

  const debouncedClinicQuery = useDebounce(clinicSearchQuery, 300);
  const debouncedDoctorQuery = useDebounce(doctorSearchQuery, 300);

  useEffect(() => {
    fetchClinics();
  }, []);

  // Auto-search clinics when debounced query changes
  useEffect(() => {
    if (debouncedClinicQuery.trim().length > 0) {
      searchClinicsByQuery(debouncedClinicQuery);
    } else {
      fetchClinics();
    }
  }, [debouncedClinicQuery]);

  // Auto-search doctors when debounced query changes
  useEffect(() => {
    if (debouncedDoctorQuery.trim().length >= 2) {
      searchDoctors(debouncedDoctorQuery);
    } else {
      setDoctorSearchResults([]);
    }
  }, [debouncedDoctorQuery]);

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

  const fetchNearbyClinics = useCallback(async (lat: number, lng: number) => {
    setIsSearchingNearby(true);
    try {
      const response = await apiClient.get('/user/clinics/nearby', {
        params: { lat, lng, radiusKm: 50 },
      });
      setClinics(response.data.clinics || []);
      setSearchMode('nearby');
    } catch (error) {
      console.error('Failed to fetch nearby clinics:', error);
      toast.error('Failed to find nearby clinics');
    } finally {
      setIsSearchingNearby(false);
    }
  }, []);

  const handleNearMe = () => {
    requestLocation();
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchNearbyClinics(latitude, longitude);
    }
  }, [latitude, longitude, fetchNearbyClinics]);

  const searchClinicsByQuery = async (query: string) => {
    setIsSearchingClinics(true);
    try {
      const response = await apiClient.get('/user/clinics/search', {
        params: { q: query.trim() },
      });
      setClinics(response.data.clinics || []);
    } catch (error) {
      console.error('Failed to search clinics:', error);
    } finally {
      setIsSearchingClinics(false);
    }
  };

  const searchDoctors = async (query: string) => {
    if (!query.trim()) {
      setDoctorSearchResults([]);
      return;
    }
    setIsSearchingDoctors(true);
    try {
      const response = await apiClient.get('/user/doctors/search', {
        params: { q: query.trim() },
      });
      setDoctorSearchResults(response.data.doctors || []);
    } catch (error) {
      console.error('Failed to search doctors:', error);
      toast.error('Failed to search doctors');
    } finally {
      setIsSearchingDoctors(false);
    }
  };

  const handleDoctorSelect = (doctor: DoctorSearchResult) => {
    setSelectedDoctorFromSearch(doctor);
    setSelectedDoctor(doctor.id);
    // If doctor has only one clinic, auto-select it and proceed
    if (doctor.clinics.length === 1) {
      setSelectedClinic(doctor.clinics[0].id);
      setWizardState({ step: 2 });
      fetchAvailableSlots(doctor.id, new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    }
  };

  const handleDoctorClinicSelect = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setWizardState({ step: 2 });
    fetchAvailableSlots(selectedDoctor, new Date(Date.now() + 86400000).toISOString().split('T')[0]);
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
      // If coming from doctor search flow, skip Step 2 (doctor already selected)
      if (selectedDoctorFromSearch) {
        fetchAvailableSlots(selectedDoctor, new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        setWizardState({ ...wizardState, step: 3 as 1 | 2 | 3 | 4 });
        return;
      }
      fetchDoctors(selectedClinic);
    } else if (wizardState.step === 2 && selectedDoctor) {
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
      // If coming from doctor search flow and at Step 3, go back to Step 1
      if (selectedDoctorFromSearch && wizardState.step === 3) {
        setWizardState({ ...wizardState, step: 1 as 1 | 2 | 3 | 4 });
        return;
      }
      setWizardState({ ...wizardState, step: wizardState.step - 1 as 1 | 2 | 3 | 4 });
    }
  };

  const handleSubmit = async () => {
    try {
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
    if (selectedDoctorFromSearch && wizardState.step === 2) {
      return 'Pick Time Slot';
    }
    switch (wizardState.step) {
      case 1:
        return searchTab === 'doctor' ? 'Search Doctor' : 'Select Clinic';
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
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Patient Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Book Appointment
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {getStepTitle()}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-start">
          {(selectedDoctorFromSearch ? [1, 3, 4] : [1, 2, 3, 4]).map((step, i) => (
            <div key={step} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div
                    className={`flex-1 h-px ${
                      wizardState.step > step || (selectedDoctorFromSearch && step === 3 && wizardState.step >= 3)
                        ? 'bg-gray-900'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0 ${
                    wizardState.step >= step || (selectedDoctorFromSearch && step === 3 && wizardState.step >= 3)
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {(wizardState.step > step || (selectedDoctorFromSearch && step === 3 && wizardState.step > 3)) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    selectedDoctorFromSearch ? (step === 1 ? 1 : step === 3 ? 2 : 3) : step
                  )}
                </div>
                {i < (selectedDoctorFromSearch ? 2 : 3) && (
                  <div
                    className={`flex-1 h-px ${
                      wizardState.step > step || (selectedDoctorFromSearch && step === 3 && wizardState.step >= 3)
                        ? 'bg-gray-900'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider mt-2 text-center">
                {selectedDoctorFromSearch
                  ? ['Select', 'Time', 'Confirm'][i]
                  : ['Clinic', 'Doctor', 'Time', 'Confirm'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl">
        <BentoCard>
          {/* Step 1: Select Clinic */}
          {wizardState.step === 1 && (
            <div className="space-y-4">
              {/* Search Tabs */}
              <div className="flex items-center gap-1 mb-4 border border-gray-200 p-1 w-fit">
                <button
                  onClick={() => setSearchTab('clinic')}
                  className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    searchTab === 'clinic'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MapPin className="w-3 h-3 mr-1.5 inline" />
                  By Clinic
                </button>
                <button
                  onClick={() => setSearchTab('doctor')}
                  className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    searchTab === 'doctor'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="w-3 h-3 mr-1.5 inline" />
                  By Doctor
                </button>
              </div>

              {/* Clinic Search Tab */}
              {searchTab === 'clinic' && (
                <>
                  {/* Location Search Bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <Button
                      variant={searchMode === 'nearby' ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleNearMe}
                      disabled={geoLoading || isSearchingNearby}
                      className={`rounded-none ${searchMode === 'nearby' ? 'bg-gray-900 text-white' : 'border-dashed'}`}
                    >
                      {geoLoading || isSearchingNearby ? (
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      ) : (
                        <Navigation className="w-3 h-3 mr-2" />
                      )}
                      Near Me
                    </Button>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by clinic name, city or address..."
                          value={clinicSearchQuery}
                          onChange={(e) => setClinicSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                        />
                      </div>
                    </div>
                    {searchMode === 'nearby' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchMode('all');
                          setClinicSearchQuery('');
                          fetchClinics();
                        }}
                        className="rounded-none text-xs text-gray-500"
                      >
                        Show All
                      </Button>
                    )}
                  </div>
                  {geoError && (
                    <p className="text-xs text-yellow-600 mb-2">{geoError}</p>
                  )}

                  {isSearchingNearby || isSearchingClinics ? (
                    <div className="text-center py-12">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">{isSearchingNearby ? 'Finding nearby clinics...' : 'Searching clinics...'}</p>
                    </div>
                  ) : clinics.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-300">
                      <MapPin className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">
                        {clinicSearchQuery ? `No clinics found for "${clinicSearchQuery}"` : 'No clinics found'}
                      </p>
                      <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mt-1">
                        {clinicSearchQuery ? 'Try a different search term' : 'Try a different location or show all clinics'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
                      {clinics.map((clinic) => (
                        <button
                          key={clinic.id}
                          onClick={() => {
                            setSelectedClinic(clinic.id);
                            handleNext();
                          }}
                          className={`p-6 text-left transition-colors ${
                            selectedClinic === clinic.id
                              ? 'bg-gray-900 text-white'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className={`w-4 h-4 ${selectedClinic === clinic.id ? 'text-gray-300' : 'text-gray-400'}`} />
                            <h3 className="text-sm font-semibold tracking-tight">
                              {clinic.name}
                            </h3>
                          </div>
                          <p className={`text-xs ${selectedClinic === clinic.id ? 'text-gray-300' : 'text-gray-500'}`}>
                            {[clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ') || 'Address not set'}
                          </p>
                          {clinic.distance != null && (
                            <p className={`text-[11px] font-mono mt-2 ${selectedClinic === clinic.id ? 'text-gray-300' : 'text-gray-400'}`}>
                              {clinic.distance.toFixed(1)} km away
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Doctor Search Tab */}
              {searchTab === 'doctor' && (
                <>
                  {/* Doctor Search Bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by doctor name..."
                          value={doctorSearchQuery}
                          onChange={(e) => setDoctorSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Doctor Search Results */}
                  {isSearchingDoctors ? (
                    <div className="text-center py-12">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">Searching doctors...</p>
                    </div>
                  ) : selectedDoctorFromSearch ? (
                    /* Show clinics for selected doctor */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-200">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold tracking-tight">
                              {selectedDoctorFromSearch.profileData?.name || 'Unknown Doctor'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {selectedDoctorFromSearch.profileData?.specialization || 'General Practice'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDoctorFromSearch(null);
                            setSelectedDoctor('');
                          }}
                          className="rounded-none text-xs text-gray-500"
                        >
                          Change Doctor
                        </Button>
                      </div>
                      <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                        Select a clinic where this doctor practices:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
                        {selectedDoctorFromSearch.clinics.map((clinic) => (
                          <button
                            key={clinic.id}
                            onClick={() => handleDoctorClinicSelect(clinic.id)}
                            className="p-6 text-left transition-colors bg-white hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <h3 className="text-sm font-semibold tracking-tight">
                                {clinic.name}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500">
                              {[clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ') || 'Address not set'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : doctorSearchQuery.trim() && doctorSearchResults.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-300">
                      <User className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No doctors found matching &quot;{doctorSearchQuery}&quot;</p>
                      <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mt-1">
                        Try a different search term
                      </p>
                    </div>
                  ) : doctorSearchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                      {doctorSearchResults.map((doctor) => (
                        <button
                          key={doctor.id}
                          onClick={() => handleDoctorSelect(doctor)}
                          className="p-6 text-left transition-colors bg-white hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-200">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold tracking-tight">
                                {doctor.profileData?.name || 'Unknown Doctor'}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {doctor.profileData?.specialization || 'General Practice'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-[11px] text-gray-400">
                              {doctor.clinics.length === 1
                                ? `1 clinic available`
                                : `${doctor.clinics.length} clinics available`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-300">
                      <User className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Search for a doctor by name</p>
                      <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mt-1">
                        Type at least 2 characters to search
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Choose Doctor */}
          {wizardState.step === 2 && (
            <div className="space-y-4">
              {isLoadingDoctors ? (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Loading doctors...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => {
                        setSelectedDoctor(doctor.id);
                        handleNext();
                      }}
                      className={`p-6 text-left transition-colors ${
                        selectedDoctor === doctor.id
                          ? 'bg-gray-900 text-white'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 flex items-center justify-center ${selectedDoctor === doctor.id ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <User className={`w-5 h-5 ${selectedDoctor === doctor.id ? 'text-gray-300' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold tracking-tight">
                            {doctor.profileData?.name || 'Unknown Doctor'}
                          </h3>
                          <p className={`text-xs ${selectedDoctor === doctor.id ? 'text-gray-300' : 'text-gray-500'}`}>
                            {doctor.profileData?.specialty || 'General Practice'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleBack}
                className="mt-4 rounded-none border-dashed"
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
                <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
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
                  className="w-full max-w-xs px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
              {isLoadingSlots ? (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Loading available slots...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      disabled={!slot.available}
                      className={`p-4 text-left transition-colors ${
                        selectedSlot?.id === slot.id
                          ? 'bg-gray-900 text-white'
                          : 'bg-white hover:bg-gray-50'
                      } ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className={`w-4 h-4 ${selectedSlot?.id === slot.id ? 'text-gray-300' : 'text-gray-400'}`} />
                        <span className="text-sm font-semibold tracking-tight">
                          {new Date(slot.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${selectedSlot?.id === slot.id ? 'text-gray-300' : 'text-gray-400'}`} />
                        <span className={`text-sm ${selectedSlot?.id === slot.id ? 'text-gray-300' : 'text-gray-500'}`}>
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-300">
                  <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No available slots for this date</p>
                  <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mt-1">
                    Please select a different date
                  </p>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="rounded-none border-dashed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedSlot}
                  className="rounded-none bg-gray-900 text-white hover:bg-gray-800"
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
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Reason for Visit
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Annual checkup, Follow-up, etc."
                    className="w-full px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information for the doctor..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 resize-none"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-6 border border-gray-200">
                <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-4">
                  Appointment Summary
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Clinic:</span>
                    <span className="font-medium text-gray-900">
                      {clinics.find((c) => c.id === selectedClinic)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Doctor:</span>
                    <span className="font-medium text-gray-900">
                      {doctors.find((d) => d.id === selectedDoctor)?.profileData?.name || 'Unknown Doctor'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-900">
                      {selectedSlot && new Date(selectedSlot.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium text-gray-900">
                      {selectedSlot?.startTime} - {selectedSlot?.endTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="rounded-none border-dashed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!reason}
                  className="rounded-none bg-gray-900 text-white hover:bg-gray-800 flex-1"
                >
                  Confirm Booking
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
