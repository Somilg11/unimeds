'use client';

import { Suspense, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { isBrowserZone, zoneLabel } from '@/lib/format';
import type { AvailabilityBlock } from '@/lib/types';
import { ErrorState, ListSkeleton, PageHeader } from '@/components/app/common';
import { AvailabilityEditor } from '@/components/app/availability-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-5 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Timezone</dt>
          <dd className="text-sm font-medium">
            {clinic.timezone}
            {!isBrowserZone(clinic.timezone) && <span className="text-muted-foreground"> ({zoneLabel(clinic.timezone)})</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Slot length</dt>
          <dd className="text-sm font-medium">{s?.slotDurationMinutes ?? '—'} min</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Booking window</dt>
          <dd className="text-sm font-medium">{s?.bookingWindowDays ?? '—'} days</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Booking approval</dt>
          <dd className="text-sm font-medium">{s?.autoConfirm ? 'Automatic' : 'You confirm'}</dd>
        </div>
      </dl>
      {!isBrowserZone(clinic.timezone) && (
        <p className="text-sm text-muted-foreground">Hours below are wall-clock times at {clinic.name}, not your local time.</p>
      )}
      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListSkeleton rows={7} />
      ) : (
        <AvailabilityEditor initial={initial} timezone={clinic.timezone} saving={save.isPending} onSave={(schedule) => save.mutate(schedule)} />
      )}
    </div>
  );
}

function ScheduleView() {
  const { params, set } = useUrlFilters();
  const { data, isLoading, error, refetch } = useDoctorClinics();
  const clinics = data?.items ?? [];
  const selected = clinics.find((c) => c.id === params.get('clinic')) ?? clinics[0];

  return (
    <>
      <PageHeader
        title="Schedule"
        description="Your weekly hours. Patients can book free slots inside these hours."
        actions={
          clinics.length > 1 && selected ? (
            <Select value={selected.id} onValueChange={(v) => set({ clinic: v })}>
              <SelectTrigger className="w-56" aria-label="Clinic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
      />
      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !selected ? (
        <ListSkeleton rows={7} />
      ) : (
        <>
          {clinics.length === 1 && <h2 className="mb-4 text-lg font-semibold">{selected.name}</h2>}
          <ClinicSchedule key={selected.id} clinic={selected} />
        </>
      )}
    </>
  );
}

export default function DoctorSchedulePage() {
  return (
    <Suspense fallback={<ListSkeleton rows={7} />}>
      <ScheduleView />
    </Suspense>
  );
}
