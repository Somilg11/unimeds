'use client';

import { Suspense, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarRange, Globe, ShieldCheck, Timer } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { isBrowserZone, zoneLabel } from '@/lib/format';
import type { AvailabilityBlock } from '@/lib/types';
import { ErrorState, ListSkeleton } from '@/components/app/common';
import { AvailabilityEditor } from '@/components/app/availability-editor';
import { FilterPill, InfoTile } from '../_components/bits';
import { useDoctorClinics, useUrlFilters, type DoctorClinic } from '../_components/hooks';

type Block = Pick<AvailabilityBlock, 'dayOfWeek' | 'startTime' | 'endTime'>;

function ClinicSchedule({ clinic }: { clinic: DoctorClinic }) {
  const qc = useQueryClient();
  const key = ['doctor', 'availability', clinic.id];
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => api.get<{ items: AvailabilityBlock[] }>('/doctor/availability', { clinicId: clinic.id }),
  });
  // Stable reference: the editor resets its state whenever `initial` changes identity
  const initial = useMemo<Block[]>(
    () => (data?.items ?? []).map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime: startTime.slice(0, 5), endTime: endTime.slice(0, 5) })),
    [data]
  );
  const save = useMutation({
    mutationFn: (schedule: Block[]) => api.put<{ items: AvailabilityBlock[] }>('/doctor/availability', { clinicId: clinic.id, schedule }),
    onSuccess: (res) => {
      qc.setQueryData(key, res);
      // Free slots and overview depend on availability
      void qc.invalidateQueries({ queryKey: ['slots'] });
      toast.success('Schedule saved');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const s = clinic.settings;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InfoTile icon={Globe} label="Timezone">
          <span className="block break-words">{clinic.timezone}</span>
          {!isBrowserZone(clinic.timezone) && <span className="block text-xs font-normal text-muted-foreground">{zoneLabel(clinic.timezone)}</span>}
        </InfoTile>
        <InfoTile icon={Timer} label="Slot length">
          {s?.slotDurationMinutes ?? '—'} min
        </InfoTile>
        <InfoTile icon={CalendarRange} label="Booking window">
          {s?.bookingWindowDays ?? '—'} days
        </InfoTile>
        <InfoTile icon={ShieldCheck} label="Approval">
          {s?.autoConfirm ? 'Automatic' : 'You confirm'}
        </InfoTile>
      </div>

      <section className="rounded-3xl bg-card p-4 sm:p-6" aria-labelledby="hours-title">
        <h2 id="hours-title" className="text-lg font-semibold tracking-tight">
          Weekly hours
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {isBrowserZone(clinic.timezone) ? `Hours at ${clinic.name}.` : `Wall-clock times at ${clinic.name}, not your local time.`}
        </p>
        {error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : isLoading ? (
          <ListSkeleton rows={7} />
        ) : (
          <AvailabilityEditor initial={initial} timezone={clinic.timezone} saving={save.isPending} onSave={(schedule) => save.mutate(schedule)} />
        )}
      </section>
    </div>
  );
}

function ScheduleView() {
  const { params, set } = useUrlFilters();
  const { data, isLoading, error, refetch } = useDoctorClinics();
  const clinics = data?.items ?? [];
  const selected = clinics.find((c) => c.id === params.get('clinic')) ?? clinics[0];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Schedule</h1>
        <p className="text-sm text-muted-foreground">Your weekly hours. Patients can book free slots inside these hours.</p>
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !selected ? (
        <ListSkeleton rows={7} />
      ) : (
        <>
          {clinics.length > 1 ? (
            <div role="group" aria-label="Clinic" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
              {clinics.map((c) => (
                <FilterPill key={c.id} active={c.id === selected.id} onClick={() => set({ clinic: c.id })}>
                  {c.name}
                </FilterPill>
              ))}
            </div>
          ) : (
            <h2 className="text-lg font-semibold">{selected.name}</h2>
          )}
          <ClinicSchedule key={selected.id} clinic={selected} />
        </>
      )}
    </div>
  );
}

export default function DoctorSchedulePage() {
  return (
    <Suspense fallback={<ListSkeleton rows={7} />}>
      <ScheduleView />
    </Suspense>
  );
}
