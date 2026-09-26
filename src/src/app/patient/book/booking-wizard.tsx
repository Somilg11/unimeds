'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Stethoscope,
} from 'lucide-react';
import { ApiError, api, errorMessage } from '@/lib/api';
import { STATUS_LABEL } from '@/lib/format';
import type { Appointment, Paged, PublicDoctor, Slot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, Pagination, StatusBadge } from '@/components/app/common';
import { SlotPicker } from '@/components/app/slot-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { BackBar, Chip, IconCircle, InfoTile, PersonAvatar } from '../_components/bits';
import { apptDayTime, PK, useDebounced } from '../_components/shared';

type DoctorClinic = PublicDoctor['clinics'][number];
type BookBody = { doctorId: string; clinicId: string; startsAt: string; reason?: string };
type Filters = {
  q: string;
  specialization: string;
  coords: { lat: number; lng: number } | null;
  radiusKm: string;
  page: number;
};

const clinicPlace = (c: DoctorClinic) => [c.address, c.city].filter(Boolean).join(', ');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// --- Step 1: find a doctor --------------------------------------------------

function DoctorCard({ doctor: d, onPick }: { doctor: PublicDoctor; onPick: () => void }) {
  const nearest = d.clinics.reduce<number | null>(
    (min, c) => (c.distanceKm != null && (min == null || c.distanceKm < min) ? c.distanceKm : min),
    null
  );
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left transition-colors hover:bg-card/70 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <PersonAvatar name={d.name} src={d.avatarUrl} className="size-16" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{d.name}</span>
        <span className="block truncate text-sm text-muted-foreground">{d.specialization ?? 'General practice'}</span>
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {d.yearsOfExperience ? (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3.5" /> <span className="tabular-nums">{d.yearsOfExperience}</span> yrs
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Building2 className="size-3.5" /> {plural(d.clinics.length, 'clinic')}
          </span>
          {nearest != null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> <span className="tabular-nums">{nearest.toFixed(1)}</span> km
            </span>
          )}
        </span>
      </span>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
        <ChevronRight className="size-4" />
      </span>
    </button>
  );
}

function DoctorSearch({
  filters,
  setFilters,
  onPick,
}: {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  onPick: (doctor: PublicDoctor, clinicId?: string) => void;
}) {
  const { q, specialization, coords, radiusKm, page } = filters;
  const [locating, setLocating] = useState(false);
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
        setFilters({ coords: { lat: Number(pos.coords.latitude.toFixed(4)), lng: Number(pos.coords.longitude.toFixed(4)) }, page: 1 });
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
  const specNames = specs.data?.items.map((s) => s.name) ?? [];
  // A specialty deep-linked from home may not be in the list yet (or differ in case); keep it visible.
  const chipNames = specialization !== 'all' && !specNames.includes(specialization) ? [specialization, ...specNames] : specNames;

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          Find your
          <br className="sm:hidden" /> doctor
        </h1>
        <div className="relative lg:max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setFilters({ q: e.target.value, page: 1 })}
            placeholder="Search a doctor or specialty"
            aria-label="Search doctors"
            className="h-13 rounded-full border-0 bg-card pl-12 text-base shadow-none"
          />
        </div>
      </div>

      <div role="group" aria-label="Specialty" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {specs.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-32 shrink-0 rounded-full" />)
        ) : (
          <>
            <Chip active={specialization === 'all'} onClick={() => setFilters({ specialization: 'all', page: 1 })}>
              All
            </Chip>
            {chipNames.map((name) => (
              <Chip key={name} icon={Stethoscope} active={specialization === name} onClick={() => setFilters({ specialization: name, page: 1 })}>
                {name}
              </Chip>
            ))}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {doctors.data ? (
            <>
              <span className="font-semibold text-foreground tabular-nums">{doctors.data.total}</span>{' '}
              {doctors.data.total === 1 ? 'doctor' : 'doctors'}
              {coords ? ' near you' : ''}
            </>
          ) : (
            ' '
          )}
        </p>
        <div className="flex items-center gap-2">
          {coords && (
            <Select value={radiusKm} onValueChange={(v) => setFilters({ radiusKm: v, page: 1 })}>
              <SelectTrigger className="h-11 rounded-full border-0 bg-card" aria-label="Search radius">
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
          )}
          <Chip
            icon={locating ? Loader2 : LocateFixed}
            active={Boolean(coords)}
            disabled={locating}
            onClick={() => (coords ? setFilters({ coords: null, page: 1 }) : locate())}
            aria-label={coords ? 'Near me (on). Tap to clear location' : 'Search near me'}
            className={cn(locating && '[&_svg]:animate-spin')}
          >
            Near me
          </Chip>
        </div>
      </div>

      {doctors.isLoading ? (
        <ListSkeleton rows={4} />
      ) : doctors.isError ? (
        <ErrorState message={errorMessage(doctors.error)} onRetry={() => void doctors.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description={coords ? 'Try a wider radius or clear your location.' : 'Try a different name or specialty.'}
        />
      ) : (
        <>
          <ul className={cn('grid gap-3 lg:grid-cols-2', doctors.isPlaceholderData && 'opacity-60')}>
            {items.map((d) => (
              <li key={d.id}>
                <DoctorCard doctor={d} onPick={() => onPick(d, d.clinics[0]?.id)} />
              </li>
            ))}
          </ul>
          <Pagination
            page={doctors.data?.page ?? page}
            totalPages={doctors.data?.totalPages ?? 1}
            total={doctors.data?.total}
            onPage={(p) => setFilters({ page: p })}
          />
        </>
      )}
    </div>
  );
}

// --- Step 2: doctor profile ------------------------------------------------

function StatTile({ icon, label, value }: { icon: typeof Briefcase; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background p-3 text-left">
      <IconCircle icon={icon} />
      <div className="min-w-0 leading-tight">
        <p className="text-lg font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function DoctorProfile({ doctor, className }: { doctor: PublicDoctor; className?: string }) {
  return (
    <section aria-label="Doctor" className={cn('rounded-3xl bg-card p-6 text-center', className)}>
      <PersonAvatar name={doctor.name} src={doctor.avatarUrl} className="mx-auto size-24 [&_[data-slot=avatar-fallback]]:text-2xl" />
      <h2 className="mt-4 text-xl font-bold tracking-tight">{doctor.name}</h2>
      <p className="text-sm text-muted-foreground">{doctor.specialization ?? 'General practice'}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatTile icon={Briefcase} label="Experience" value={doctor.yearsOfExperience ? `${doctor.yearsOfExperience}+ yrs` : '—'} />
        <StatTile icon={Building2} label={doctor.clinics.length === 1 ? 'Clinic' : 'Clinics'} value={doctor.clinics.length} />
      </div>
      {doctor.bio && (
        <div className="mt-5 text-left">
          <h3 className="text-sm font-semibold">About</h3>
          <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">{doctor.bio}</p>
        </div>
      )}
    </section>
  );
}

function ProgressDots({ step }: { step: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} aria-hidden className={cn('h-1.5 rounded-full transition-all', n === step ? 'w-5 bg-foreground' : 'w-1.5 bg-border')} />
      ))}
    </span>
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

  // Search filters survive the round trip to a doctor and back. `?q=` / `?specialization=` (from home) pre-fill them.
  const qParam = searchParams.get('q') ?? '';
  const specParam = searchParams.get('specialization') ?? '';
  const [filters, setFiltersState] = useState<Filters>(() => ({
    q: qParam,
    specialization: specParam || 'all',
    coords: null,
    radiusKm: '25',
    page: 1,
  }));
  const [seenParams, setSeenParams] = useState(`${qParam}|${specParam}`);
  if (seenParams !== `${qParam}|${specParam}`) {
    setSeenParams(`${qParam}|${specParam}`);
    if (qParam || specParam) setFiltersState((f) => ({ ...f, q: qParam, specialization: specParam || 'all', page: 1 }));
  }
  const setFilters = (patch: Partial<Filters>) => setFiltersState((f) => ({ ...f, ...patch }));

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

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const pickDoctor = (d: PublicDoctor, clinicId?: string) => {
    setPicked(d);
    setStage('time');
    navigate({ doctorId: d.id, clinicId });
    toTop();
  };

  const book = useMutation({
    mutationFn: (body: BookBody) => api.post<{ appointment: Appointment }>('/patient/appointments', body),
    onSuccess: ({ appointment }, vars) => {
      setBooked(appointment);
      setReason('');
      setSelection(null);
      void qc.invalidateQueries({ queryKey: PK.all });
      void qc.invalidateQueries({ queryKey: ['slots', vars.doctorId, vars.clinicId] });
      toTop();
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
    const { date, time } = apptDayTime(booked.startsAt, booked.clinic.timezone);
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <section className="rounded-3xl bg-brand p-6 text-brand-foreground" aria-live="polite">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-white/20">
            <CalendarCheck className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">{confirmed ? 'Your visit is booked' : 'Request sent'}</h1>
          <p className="mt-1 text-sm text-brand-foreground/80">
            {confirmed ? 'The clinic has confirmed your appointment.' : 'The clinic will review your request. We’ll notify you once it’s confirmed.'}
          </p>
          <div className="mt-6 flex items-center gap-3 border-t border-white/20 pt-5">
            <PersonAvatar name={booked.doctor.name} src={booked.doctor.avatarUrl} className="ring-2 ring-white/30 [&_[data-slot=avatar-fallback]]:bg-white [&_[data-slot=avatar-fallback]]:text-brand" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{booked.doctor.name}</p>
              <p className="truncate text-sm text-brand-foreground/80">{booked.doctor.specialization ?? 'Doctor'}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <CalendarDays className="size-4" /> {date}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <Clock className="size-4" /> {time}
            </span>
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <MapPin className="size-4 shrink-0" /> <span className="truncate">{booked.clinic.name}</span>
            </span>
          </div>
          <div className="mt-4">
            <StatusBadge status={booked.status} tone="inverted" />
          </div>
        </section>
        <Button asChild size="lg" variant="secondary" className="h-13 w-full text-base">
          <Link href={`/patient/appointments/${booked.id}`}>View appointment</Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-13 w-full text-base"
          onClick={() => {
            setBooked(null);
            setStage('time');
            navigate({});
          }}
        >
          Book another visit
        </Button>
      </div>
    );
  }

  if (step === 1) return <DoctorSearch filters={filters} setFilters={setFilters} onPick={pickDoctor} />;

  if (!doctor) {
    const gone = doctorQ.error instanceof ApiError && doctorQ.error.status === 404;
    return (
      <>
        <BackBar title="Doctor details" onBack={() => navigate({})} label="Back to doctors" />
        {doctorQ.isError ? (
          <div className="space-y-4">
            <ErrorState
              message={gone ? 'This doctor is no longer available for booking.' : errorMessage(doctorQ.error)}
              onRetry={gone ? undefined : () => void doctorQ.refetch()}
            />
            <Button variant="outline" size="lg" className="h-12 w-full sm:w-auto" onClick={() => navigate({})}>
              <ArrowLeft /> Find another doctor
            </Button>
          </div>
        ) : (
          <div className="space-y-4" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <ListSkeleton rows={2} />
          </div>
        )}
      </>
    );
  }

  const slotWhen = slot && clinic ? apptDayTime(slot.startsAt, clinic.timezone) : null;

  return (
    <>
      {step === 2 ? (
        <BackBar title="Doctor details" onBack={() => navigate({})} label="Back to doctors">
          <ProgressDots step={2} />
        </BackBar>
      ) : (
        <BackBar title="Review & book" onBack={() => setStage('time')} label="Back to choose a time">
          <ProgressDots step={3} />
        </BackBar>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
        <DoctorProfile doctor={doctor} className={cn('lg:sticky lg:top-6', step === 3 && 'hidden lg:block')} />

        <div className="min-w-0 space-y-6">
          {step === 2 && (
            <>
              {doctor.clinics.length === 0 ? (
                <EmptyState icon={Building2} title="Not bookable online" description="This doctor has no clinics taking online bookings right now." />
              ) : (
                <section aria-labelledby="clinic-heading">
                  <h2 id="clinic-heading" className="mb-3 text-lg font-semibold tracking-tight">
                    Choose clinic
                  </h2>
                  <div role="group" aria-label="Clinic" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
                    {doctor.clinics.map((c) => (
                      <Chip
                        key={c.id}
                        icon={Building2}
                        active={clinic?.id === c.id}
                        onClick={() => navigate({ doctorId: doctor.id, clinicId: c.id })}
                        disabled={book.isPending}
                      >
                        {c.name}
                      </Chip>
                    ))}
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {clinic ? (
                      <span>
                        {clinicPlace(clinic) || 'Address not listed'}
                        {clinic.distanceKm != null && ` · ${clinic.distanceKm.toFixed(1)} km away`}
                      </span>
                    ) : (
                      <span>Choose a clinic to see available times.</span>
                    )}
                  </p>
                </section>
              )}

              {clinic && (
                <>
                  <section aria-labelledby="time-heading">
                    <h2 id="time-heading" className="mb-3 text-lg font-semibold tracking-tight">
                      Select date &amp; time
                    </h2>
                    <SlotPicker
                      key={selectionKey}
                      doctorId={doctor.id}
                      clinicId={clinic.id}
                      timezone={clinic.timezone}
                      value={slot?.startsAt ?? null}
                      onChange={(s) => setSelection(s ? { key: selectionKey, slot: s } : null)}
                    />
                  </section>

                  <div className="sticky bottom-24 z-20 lg:bottom-6">
                    <Button
                      size="lg"
                      className="h-13 w-full text-base"
                      disabled={!slot}
                      onClick={() => {
                        setStage('details');
                        toTop();
                      }}
                    >
                      {slotWhen ? `Continue · ${slotWhen.date}, ${slotWhen.time}` : 'Select a time to continue'}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {step === 3 && clinic && slot && slotWhen && (
            <>
              <section aria-labelledby="review-heading" className="rounded-3xl bg-card p-5">
                <h2 id="review-heading" className="sr-only">
                  Your visit
                </h2>
                <div className="flex items-center gap-3">
                  <PersonAvatar name={doctor.name} src={doctor.avatarUrl} className="size-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{doctor.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{doctor.specialization ?? 'General practice'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStage('time')} disabled={book.isPending}>
                    Change
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
                  <InfoTile icon={CalendarDays} label="Date" className="bg-background p-3">
                    {slotWhen.date}
                  </InfoTile>
                  <InfoTile icon={Clock} label="Time" className="bg-background p-3">
                    <span className="tabular-nums">{slotWhen.time}</span>
                  </InfoTile>
                  <InfoTile icon={MapPin} label="Clinic" className="col-span-2 bg-background p-3">
                    {clinic.name}
                    {clinicPlace(clinic) && <span className="mt-0.5 block font-normal text-muted-foreground">{clinicPlace(clinic)}</span>}
                  </InfoTile>
                </div>
              </section>

              <section className="space-y-2 rounded-3xl bg-card p-5">
                <Label htmlFor="book-reason" className="text-base font-semibold">
                  Reason for visit <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="book-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Briefly describe your symptoms or what you'd like to discuss"
                  aria-describedby="book-reason-hint"
                />
                <p id="book-reason-hint" className="text-xs text-muted-foreground">
                  Shared only with the clinic and doctor.
                </p>
              </section>

              <p className="px-1 text-xs text-muted-foreground">
                New bookings are usually “{STATUS_LABEL.pending.toLowerCase()}” until the clinic confirms them.
              </p>

              <div className="sticky bottom-24 z-20 lg:bottom-6">
                <Button size="lg" className="h-13 w-full text-base" onClick={submit} disabled={book.isPending}>
                  {book.isPending && <Loader2 className="animate-spin" />}
                  Book appointment
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
