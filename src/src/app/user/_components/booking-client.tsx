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
    // If doctor has only one clinic, auto-select it and go straight to time slots
    if (doctor.clinics.length === 1) {
      setSelectedClinic(doctor.clinics[0].id);
      setWizardState({ step: 3 });
      fetchAvailableSlots(doctor.id, new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    }
  };

  const handleDoctorClinicSelect = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setWizardState({ step: 3 });
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
    if (!selectedClinic) return;
    setIsLoadingSlots(true);
    try {
      const response = await apiClient.get('/user/slots', {
        params: { doctorId, date, clinicId: selectedClinic }
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
      if (selectedDoctorFromSearch && selectedDoctor) {
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
      // If coming from doctor search flow and at Step 3, go back to Step 1 and reset doctor selection
      if (selectedDoctorFromSearch && wizardState.step === 3) {
        setSelectedDoctorFromSearch(null);
        setSelectedDoctor('');
        setSelectedClinic('');
        setWizardState({ step: 1 });
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
      <div className="mb-10">
        <div className="flex items-start">
          {(selectedDoctorFromSearch ? [1, 3, 4] : [1, 2, 3, 4]).map((step, i) => (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              <div className="flex items-center w-full relative z-10">
                {i > 0 && (
                  <div
                    className={`flex-1 h-[2px] transition-colors ${
                      wizardState.step > step || (selectedDoctorFromSearch && step === 3 && wizardState.step >= 3)
                        ? 'bg-primary'
                        : 'bg-gray-100'
                    }`}
                  />
                )}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all shadow-sm ${
                    wizardState.step >= step || (selectedDoctorFromSearch && step === 3 && wizardState.step >= 3)
                      ? 'bg-primary text-white ring-4 ring-primary/10'
                      : 'bg-white border-2 border-gray-100 text-gray-400'
                  }`}
                >
                  {(wizardState.step > step || (selectedDoctorFromSearch && step === 3 && wizardState.step > 3)) ? (
                    <Check className="w-4.5 h-4.5" />
                  ) : (
                    selectedDoctorFromSearch ? (step === 1 ? 1 : step === 3 ? 2 : 3) : step
                  )}
                </div>
                {i < (selectedDoctorFromSearch ? 2 : 3) && (
                  <div
                    className={`flex-1 h-[2px] transition-colors ${
                      wizardState.step > step || (selectedDoctorFromSearch && step === 3 && wizardState.step >= 3)
                        ? 'bg-primary'
                        : 'bg-gray-100'
                    }`}
                  />
                )}
              </div>
              <span className={`text-[12px] font-medium tracking-wide mt-3 text-center transition-colors ${
                wizardState.step >= step ? 'text-gray-900' : 'text-gray-400'
              }`}>
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
              <div className="flex items-center gap-1 mb-6 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-100/50">
                <button
                  onClick={() => {
                    setSearchTab('clinic');
                    // Clear doctor search state when switching to clinic tab
                    setSelectedDoctorFromSearch(null);
                    setSelectedDoctor('');
                  }}
                  className={`px-5 py-2 text-[13px] font-medium tracking-wide transition-all rounded-lg flex items-center ${
                    searchTab === 'clinic'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 mr-2" />
                  By Clinic
                </button>
                <button
                  onClick={() => {
                    setSearchTab('doctor');
                    // Clear clinic search state when switching to doctor tab
                    setClinicSearchQuery('');
                    setSelectedClinic('');
                    fetchClinics();
                  }}
                  className={`px-5 py-2 text-[13px] font-medium tracking-wide transition-all rounded-lg flex items-center ${
                    searchTab === 'doctor'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 mr-2" />
                  By Doctor
                </button>
              </div>

              {/* Clinic Search Tab */}
              {searchTab === 'clinic' && (
                <>
                  {/* Location Search Bar */}
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant={searchMode === 'nearby' ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleNearMe}
                      disabled={geoLoading || isSearchingNearby}
                      className={`h-11 px-5 rounded-xl transition-all ${
                        searchMode === 'nearby' 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {geoLoading || isSearchingNearby ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4 mr-2" />
                      )}
                      Near Me
                    </Button>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by clinic name, city or address..."
                          value={clinicSearchQuery}
                          onChange={(e) => setClinicSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
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
                        className="rounded-xl text-[13px] text-gray-500 hover:bg-gray-100 px-4 h-11"
                      >
                        Show All
                      </Button>
                    )}
                  </div>
                  {geoError && (
                    <p className="text-xs text-yellow-600 mb-2">{geoError}</p>
                  )}

                  {isSearchingNearby || isSearchingClinics ? (
                    <div className="text-center py-16">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/40 mb-3" />
                      <p className="text-[14px] text-gray-500">{isSearchingNearby ? 'Finding nearby clinics...' : 'Searching clinics...'}</p>
                    </div>
                  ) : clinics.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-[15px] font-semibold text-gray-900 mb-1">
                        {clinicSearchQuery ? `No clinics found for "${clinicSearchQuery}"` : 'No clinics found'}
                      </p>
                      <p className="text-[13px] text-gray-500">
                        {clinicSearchQuery ? 'Try a different search term' : 'Try a different location or show all clinics'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clinics.map((clinic) => (
                        <button
                          key={clinic.id}
                          onClick={() => {
                            setSelectedClinic(clinic.id);
                            handleNext();
                          }}
                          className={`p-6 text-left transition-all rounded-2xl border shadow-sm hover:shadow-md ${
                            selectedClinic === clinic.id
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white border-gray-100 hover:border-primary/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedClinic === clinic.id ? 'bg-white/10' : 'bg-gray-50'}`}>
                              <MapPin className={`w-5 h-5 ${selectedClinic === clinic.id ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                            <h3 className="text-[15px] font-semibold tracking-tight">
                              {clinic.name}
                            </h3>
                          </div>
                          <p className={`text-[13px] leading-relaxed ${selectedClinic === clinic.id ? 'text-primary-foreground/80' : 'text-gray-500'}`}>
                            {[clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ') || 'Address not set'}
                          </p>
                          {clinic.distance != null && (
                            <div className={`mt-4 inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium ${selectedClinic === clinic.id ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {clinic.distance.toFixed(1)} km away
                            </div>
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by doctor name..."
                          value={doctorSearchQuery}
                          onChange={(e) => setDoctorSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Doctor Search Results */}
                  {isSearchingDoctors ? (
                    <div className="text-center py-16">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/40 mb-3" />
                      <p className="text-[14px] text-gray-500">Searching doctors...</p>
                    </div>
                  ) : selectedDoctorFromSearch ? (
                    /* Show clinics for selected doctor */
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm border border-gray-100">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
                              {selectedDoctorFromSearch.profileData?.name || 'Unknown Doctor'}
                            </h3>
                            <p className="text-[13px] text-gray-500">
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
                          className="rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 shadow-sm transition-all h-10 px-4"
                        >
                          Change Doctor
                        </Button>
                      </div>
                      <p className="text-[12px] font-medium uppercase text-gray-400 tracking-wider">
                        Select a clinic where this doctor practices
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedDoctorFromSearch.clinics.map((clinic) => (
                          <button
                            key={clinic.id}
                            onClick={() => handleDoctorClinicSelect(clinic.id)}
                            className="p-6 text-left transition-all bg-white hover:border-primary/30 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-gray-400" />
                              </div>
                              <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
                                {clinic.name}
                              </h3>
                            </div>
                            <p className="text-[13px] leading-relaxed text-gray-500">
                              {[clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ') || 'Address not set'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : doctorSearchQuery.trim() && doctorSearchResults.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-[15px] font-semibold text-gray-900 mb-1">No doctors found matching "{doctorSearchQuery}"</p>
                      <p className="text-[13px] text-gray-500">
                        Try a different search term
                      </p>
                    </div>
                  ) : doctorSearchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {doctorSearchResults.map((doctor) => (
                        <button
                          key={doctor.id}
                          onClick={() => handleDoctorSelect(doctor)}
                          className="p-6 text-left transition-all bg-white hover:border-primary/30 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
                                {doctor.profileData?.name || 'Unknown Doctor'}
                              </h3>
                              <p className="text-[13px] text-gray-500">
                                {doctor.profileData?.specialization || 'General Practice'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg w-fit">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <p className="text-[12px] font-medium text-gray-600">
                              {doctor.clinics.length === 1
                                ? `1 clinic available`
                                : `${doctor.clinics.length} clinics available`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-[15px] font-semibold text-gray-900 mb-1">Search for a doctor by name</p>
                      <p className="text-[13px] text-gray-500">
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
            <div className="space-y-6">
              {isLoadingDoctors ? (
                <div className="text-center py-16">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/40 mb-3" />
                  <p className="text-[14px] text-gray-500">Loading doctors...</p>
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
                      className={`p-6 text-left transition-all rounded-2xl border shadow-sm hover:shadow-md ${
                        selectedDoctor === doctor.id
                          ? 'bg-primary border-primary text-white'
                          : 'bg-white border-gray-100 hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedDoctor === doctor.id ? 'bg-white/10' : 'bg-gray-50 border border-gray-100'}`}>
                          <User className={`w-6 h-6 ${selectedDoctor === doctor.id ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-semibold tracking-tight">
                            {doctor.profileData?.name || 'Unknown Doctor'}
                          </h3>
                          <p className={`text-[13px] mt-0.5 ${selectedDoctor === doctor.id ? 'text-primary-foreground/80' : 'text-gray-500'}`}>
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
                className="mt-6 rounded-xl border-gray-200 hover:bg-gray-50 h-11 px-6 font-medium shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}

          {/* Step 3: Pick Time Slot */}
          {wizardState.step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="text-[12px] font-medium text-gray-500 mb-2 block">
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
                  className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>
              {isLoadingSlots ? (
                <div className="text-center py-16">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/40 mb-3" />
                  <p className="text-[14px] text-gray-500">Loading available slots...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      disabled={!slot.available}
                      className={`p-4 text-left transition-all rounded-2xl border shadow-sm ${
                        selectedSlot?.id === slot.id
                          ? 'bg-primary border-primary text-white shadow-md'
                          : 'bg-white border-gray-100 hover:border-primary/20 hover:shadow-md'
                      } ${!slot.available ? 'opacity-50 cursor-not-allowed bg-gray-50 hover:border-gray-100 hover:shadow-sm' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <Calendar className={`w-4.5 h-4.5 ${selectedSlot?.id === slot.id ? 'text-white' : 'text-gray-400'}`} />
                        <span className="text-[14px] font-semibold tracking-tight">
                          {new Date(slot.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className={`w-4.5 h-4.5 ${selectedSlot?.id === slot.id ? 'text-white/80' : 'text-gray-400'}`} />
                        <span className={`text-[13px] font-medium ${selectedSlot?.id === slot.id ? 'text-white/90' : 'text-gray-600'}`}>
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-[15px] font-semibold text-gray-900 mb-1">No available slots for this date</p>
                  <p className="text-[13px] text-gray-500">
                    Please select a different date
                  </p>
                </div>
              )}
              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="rounded-xl border-gray-200 hover:bg-gray-50 h-11 px-6 font-medium shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedSlot}
                  className="rounded-xl bg-primary text-white hover:bg-primary/90 h-11 px-8 font-semibold shadow-sm"
                >
                  Continue
                  <ChevronRight className="w-4.5 h-4.5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm Details */}
          {wizardState.step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-2 block">
                    Reason for Visit
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Annual checkup, Follow-up, etc."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-2 block">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information for the doctor..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm resize-none"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50/50 p-6 border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-[12px] font-semibold uppercase text-gray-400 tracking-wider mb-5">
                  Appointment Summary
                </p>
                <div className="space-y-4 text-[14px]">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between py-3 border-b border-gray-100/80">
                    <span className="text-gray-500 font-medium mb-1 sm:mb-0">Date & Time</span>
                    <span className="font-semibold text-gray-900">
                      {selectedSlot ? `${new Date(selectedSlot.date).toLocaleDateString()} at ${selectedSlot.startTime}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between py-3 border-b border-gray-100/80">
                    <span className="text-gray-500 font-medium mb-1 sm:mb-0">Doctor</span>
                    <span className="font-semibold text-gray-900">
                      {doctors.find((d) => d.id === selectedDoctor)?.profileData?.name || 
                       selectedDoctorFromSearch?.profileData?.name || 'Selected Doctor'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between py-3">
                    <span className="text-gray-500 font-medium mb-1 sm:mb-0">Clinic</span>
                    <span className="font-semibold text-gray-900 sm:text-right max-w-xs">
                      {clinics.find((c) => c.id === selectedClinic)?.name || 
                       selectedDoctorFromSearch?.clinics.find(c => c.id === selectedClinic)?.name || 'Selected Clinic'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="rounded-xl border-gray-200 hover:bg-gray-50 h-11 px-6 font-medium shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!reason.trim()}
                  className="rounded-xl bg-primary text-white hover:bg-primary/90 h-11 px-8 font-semibold shadow-sm flex-1 sm:flex-none"
                >
                  <Check className="w-4.5 h-4.5 mr-2" />
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
