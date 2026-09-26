'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Building2, CalendarCheck, Check, Clock, Loader2, LocateFixed, MapPin, Search, Stethoscope, X } from 'lucide-react';
import { ApiError, api, errorMessage } from '@/lib/api';
import { initials, STATUS_LABEL } from '@/lib/format';
import type { Appointment, Paged, PublicDoctor, Slot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination, StatusBadge } from '@/components/app/common';
import { SlotPicker } from '@/components/app/slot-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apptTime, PK, useDebounced } from '../_components/shared';

type DoctorClinic = PublicDoctor['clinics'][number];
type BookBody = { doctorId: string; clinicId: string; startsAt: string; reason?: string };

const STEPS = ['Find a doctor', 'Choose a time', 'Review & book'];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 text-sm" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={current ? 'step' : undefined}>
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
                done && 'border-primary bg-primary text-primary-foreground',
                current && 'border-primary text-primary'
              )}
            >
              {done ? <Check className="size-3.5" /> : n}
            </span>
            <span className={cn(!current && 'text-muted-foreground', current && 'font-medium')}>{label}</span>
            {n < STEPS.length && <span className="mx-1 hidden h-px w-8 bg-border sm:block" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function DoctorAvatar({ doctor, className }: { doctor: Pick<PublicDoctor, 'name' | 'avatarUrl'>; className?: string }) {
  return (
    <Avatar className={cn('size-12', className)}>
      {doctor.avatarUrl && <AvatarImage src={doctor.avatarUrl} alt="" />}
      <AvatarFallback>{initials(doctor.name)}</AvatarFallback>
    </Avatar>
  );
}

const clinicPlace = (c: DoctorClinic) => [c.address, c.city].filter(Boolean).join(', ');

// --- Step 1 ---------------------------------------------------------------

function DoctorSearch({ onPick }: { onPick: (doctor: PublicDoctor, clinicId?: string) => void }) {
  const [q, setQ] = useState('');
  const [specialization, setSpecialization] = useState('all');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState('25');
  const [locating, setLocating] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounced(q.trim());

  const specs = useQuery({
    queryKey: ['public', 'specializations'],
    queryFn: () => api.get<{ items: Array<{ name: string; doctors: number }> }>('/public/specializations'),
    staleTime: 5 * 60_000,
  });

  const params = {
    q: debouncedQ || undefined,
    specialization: specialization === 'all' ? undefined : specialization,
    lat: coords?.lat,
    lng: coords?.lng,
    radiusKm: coords ? Number(radiusKm) : undefined,
    page,
  };
  const doctors = useQuery({
    queryKey: ['public', 'doctors', params],
    queryFn: () => api.get<Paged<PublicDoctor>>('/public/doctors', params),
    placeholderData: (prev) => prev,
  });

  const locate = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Location isn’t available in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: Number(pos.coords.latitude.toFixed(4)), lng: Number(pos.coords.longitude.toFixed(4)) });
        setPage(1);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast.error(err.code === err.PERMISSION_DENIED ? 'Location permission was denied' : 'We couldn’t get your location');
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  };

  const items = doctors.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search doctors by name or specialty"
            aria-label="Search doctors"
            className="pl-9"
          />
        </div>
        <Select
          value={specialization}
          onValueChange={(v) => {
            setSpecialization(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full" aria-label="Specialization">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specializations</SelectItem>
            {specs.data?.items.map((s) => (
              <SelectItem key={s.name} value={s.name}>
                {s.name} ({s.doctors})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {coords ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <LocateFixed className="size-3.5" /> Near you
            </span>
            <Select
              value={radiusKm}
              onValueChange={(v) => {
                setRadiusKm(v);
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-32" aria-label="Search radius">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['5', '10', '25', '50', '100'].map((r) => (
                  <SelectItem key={r} value={r}>
                    Within {r} km
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCoords(null);
                setPage(1);
              }}
            >
              <X /> Clear location
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={locate} disabled={locating}>
            {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
            Near me
          </Button>
        )}
      </div>

      {doctors.isLoading ? (
        <ListSkeleton rows={3} />
      ) : doctors.isError ? (
        <ErrorState message={errorMessage(doctors.error)} onRetry={() => void doctors.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description={coords ? 'Try a wider radius or clear your location.' : 'Try a different name or specialization.'}
        />
      ) : (
        <>
          <ul className={cn('grid gap-4 md:grid-cols-2', doctors.isPlaceholderData && 'opacity-60')}>
            {items.map((d) => (
              <li key={d.id}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <DoctorAvatar doctor={d} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{d.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {d.specialization ?? 'General practice'}
                          {d.yearsOfExperience ? ` · ${d.yearsOfExperience} yrs experience` : ''}
                        </p>
                      </div>
                    </div>
                    {d.bio && <p className="line-clamp-2 text-sm text-muted-foreground">{d.bio}</p>}
                    <ul className="mt-auto space-y-2">
                      {d.clinics.map((c) => (
                        <li key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                          <Building2 className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1 text-sm">
                            <p className="truncate font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {clinicPlace(c) || 'Address not listed'}
                              {c.distanceKm != null && ` · ${c.distanceKm.toFixed(1)} km`}
                            </p>
                          </div>
                          <Button size="sm" onClick={() => onPick(d, c.id)} aria-label={`Book ${d.name} at ${c.name}`}>
                            Book
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <Pagination page={doctors.data?.page ?? page} totalPages={doctors.data?.totalPages ?? 1} total={doctors.data?.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}

// --- Wizard ---------------------------------------------------------------

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  // The chosen doctor / clinic live in the URL (deep-linkable); everything else is derived from it.
  const doctorId = searchParams.get('doctorId');
  const clinicParam = searchParams.get('clinicId');

  const [picked, setPicked] = useState<PublicDoctor | null>(null);
  const [selection, setSelection] = useState<{ key: string; slot: Slot } | null>(null);
  const [stage, setStage] = useState<'time' | 'details'>('time');
  const [reason, setReason] = useState('');
  const [booked, setBooked] = useState<Appointment | null>(null);

  const doctorQ = useQuery({
    queryKey: ['public', 'doctor', doctorId],
    queryFn: () => api.get<{ doctor: PublicDoctor }>(`/public/doctors/${doctorId}`),
    enabled: Boolean(doctorId),
  });
  const doctor = doctorQ.data?.doctor ?? (picked && picked.id === doctorId ? picked : null);
  const clinic: DoctorClinic | undefined = doctor
    ? (doctor.clinics.find((c) => c.id === clinicParam) ?? (doctor.clinics.length === 1 ? doctor.clinics[0] : undefined))
    : undefined;

  // A selected slot only counts for the doctor × clinic it was picked for
  const selectionKey = `${doctorId}:${clinic?.id}`;
  const slot = selection?.key === selectionKey ? selection.slot : null;
  const step = booked ? 4 : !doctorId ? 1 : stage === 'details' && doctor && clinic && slot ? 3 : 2;

  const navigate = (next: { doctorId?: string; clinicId?: string }) => {
    const params = new URLSearchParams();
    if (next.doctorId) params.set('doctorId', next.doctorId);
    if (next.clinicId) params.set('clinicId', next.clinicId);
    const s = params.toString();
    router.replace(`/patient/book${s ? `?${s}` : ''}`, { scroll: false });
  };

  const pickDoctor = (d: PublicDoctor, clinicId?: string) => {
    setPicked(d);
    setStage('time');
    navigate({ doctorId: d.id, clinicId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const book = useMutation({
    mutationFn: (body: BookBody) => api.post<{ appointment: Appointment }>('/patient/appointments', body),
    onSuccess: ({ appointment }, vars) => {
      setBooked(appointment);
      setReason('');
      setSelection(null);
      void qc.invalidateQueries({ queryKey: PK.all });
      void qc.invalidateQueries({ queryKey: ['slots', vars.doctorId, vars.clinicId] });
    },
    onError: (err, vars) => {
      if (err instanceof ApiError && err.code === 'SLOT_UNAVAILABLE') {
        toast.error(err.message || 'That time was just taken. Please pick another slot.');
        setSelection(null);
        setStage('time');
        void qc.invalidateQueries({ queryKey: ['slots', vars.doctorId, vars.clinicId] });
      } else {
        toast.error(errorMessage(err));
      }
    },
  });

  const submit = () => {
    if (!doctor || !clinic || !slot) return;
    book.mutate({ doctorId: doctor.id, clinicId: clinic.id, startsAt: slot.startsAt, reason: reason.trim() || undefined });
  };

  // --- Success ---
  if (booked) {
    const confirmed = booked.status === 'confirmed';
    return (
      <>
        <PageHeader title="Find care" />
        <Card className="mx-auto max-w-xl">
          <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarCheck className="size-6" />
            </span>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{confirmed ? 'Your visit is booked' : 'Request sent'}</h2>
              <p className="text-sm text-muted-foreground">
                {confirmed
                  ? 'The clinic has confirmed your appointment.'
                  : 'The clinic will review your request. We’ll notify you once it’s confirmed.'}
              </p>
            </div>
            <StatusBadge status={booked.status} />
            <dl className="w-full space-y-1 rounded-xl border p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Doctor</dt>
                <dd className="text-right font-medium">{booked.doctor.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Clinic</dt>
                <dd className="text-right">{booked.clinic.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">When</dt>
                <dd className="text-right">{apptTime(booked.startsAt, booked.clinic.timezone)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href={`/patient/appointments/${booked.id}`}>View appointment</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setBooked(null);
                  setStage('time');
                  navigate({});
                }}
              >
                Book another visit
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Find care" description="Search for a doctor, pick a time, and book in under a minute." />
      <Stepper step={step} />

      {step === 1 && <DoctorSearch onPick={pickDoctor} />}

      {step >= 2 && !doctor && (
        doctorQ.isError ? (
          <div className="space-y-4">
            <ErrorState
              message={doctorQ.error instanceof ApiError && doctorQ.error.status === 404 ? 'This doctor is no longer available for booking.' : errorMessage(doctorQ.error)}
              onRetry={doctorQ.error instanceof ApiError && doctorQ.error.status === 404 ? undefined : () => void doctorQ.refetch()}
            />
            <Button variant="outline" onClick={() => navigate({})}>
              <ArrowLeft /> Find another doctor
            </Button>
          </div>
        ) : (
          <ListSkeleton rows={2} />
        )
      )}

      {step >= 2 && doctor && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Summary column */}
          <aside className="space-y-4">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <DoctorAvatar doctor={doctor} />
                  <div className="min-w-0">
                    <h2 className="font-medium">{doctor.name}</h2>
                    <p className="text-sm text-muted-foreground">{doctor.specialization ?? 'General practice'}</p>
                  </div>
                </div>
                {clinic && (
                  <div className="flex gap-2 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{clinic.name}</p>
                      {clinicPlace(clinic) && <p className="text-muted-foreground">{clinicPlace(clinic)}</p>}
                    </div>
                  </div>
                )}
                {slot && clinic && (
                  <div className="flex gap-2 text-sm">
                    <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p>{apptTime(slot.startsAt, clinic.timezone)}</p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate({})} disabled={book.isPending}>
                  <ArrowLeft /> Choose another doctor
                </Button>
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0 space-y-6">
            {step === 2 && (
              <>
                {doctor.clinics.length > 1 && (
                  <fieldset className="space-y-3">
                    <legend className="mb-3 font-medium">Where would you like to be seen?</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {doctor.clinics.map((c) => {
                        const active = clinic?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => navigate({ doctorId: doctor.id, clinicId: c.id })}
                            className={cn(
                              'flex items-start gap-3 rounded-xl border p-4 text-left text-sm transition-colors',
                              active ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                            )}
                          >
                            <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block font-medium">{c.name}</span>
                              <span className="block text-xs text-muted-foreground">{clinicPlace(c) || 'Address not listed'}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {doctor.clinics.length === 0 && (
                  <EmptyState icon={Building2} title="Not bookable online" description="This doctor has no clinics taking online bookings right now." />
                )}

                {clinic && (
                  <div className="space-y-4">
                    <h2 className="font-medium">Pick a time</h2>
                    <SlotPicker
                      key={selectionKey}
                      doctorId={doctor.id}
                      clinicId={clinic.id}
                      timezone={clinic.timezone}
                      value={slot?.startsAt ?? null}
                      onChange={(s) => setSelection(s ? { key: selectionKey, slot: s } : null)}
                    />
                    <div className="flex justify-end">
                      <Button disabled={!slot} onClick={() => setStage('details')}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 3 && clinic && slot && (
              <Card>
                <CardContent className="space-y-5">
                  <h2 className="font-medium">Review your visit</h2>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Doctor</dt>
                      <dd className="font-medium">{doctor.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Clinic</dt>
                      <dd className="font-medium">{clinic.name}</dd>
                      {clinicPlace(clinic) && <dd className="text-muted-foreground">{clinicPlace(clinic)}</dd>}
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Date & time (clinic time)</dt>
                      <dd className="font-medium">{apptTime(slot.startsAt, clinic.timezone)}</dd>
                    </div>
                  </dl>
                  <div className="space-y-1.5">
                    <Label htmlFor="book-reason">Reason for visit (optional)</Label>
                    <Textarea
                      id="book-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={1000}
                      rows={4}
                      placeholder="Briefly describe your symptoms or what you'd like to discuss"
                    />
                    <p className="text-xs text-muted-foreground">Shared only with the clinic and doctor.</p>
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button variant="outline" onClick={() => setStage('time')} disabled={book.isPending}>
                      <ArrowLeft /> Change time
                    </Button>
                    <Button onClick={submit} disabled={book.isPending}>
                      {book.isPending && <Loader2 className="animate-spin" />}
                      Confirm booking
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    New bookings are usually “{STATUS_LABEL.pending.toLowerCase()}” until the clinic confirms them.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      )}
    </>
  );
}
