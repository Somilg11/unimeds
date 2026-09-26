'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import type { AvailabilityBlock } from '@/lib/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ErrorState, ListSkeleton } from '@/components/app/common';
import { AvailabilityEditor } from '@/components/app/availability-editor';
import type { TeamMember } from './types';

type Items = { items: AvailabilityBlock[] };

/** Edit a doctor's weekly hours at this clinic (GET/PUT /clinic/team/:id/availability). */
export function ScheduleSheet({ member, timezone, onClose }: { member: TeamMember | null; timezone: string; onClose: () => void }) {
  const qc = useQueryClient();
  const key = ['clinic', 'availability', member?.id ?? ''];
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => api.get<Items>(`/clinic/team/${member!.id}/availability`),
    enabled: Boolean(member),
  });
  const initial = useMemo(
    () => (data?.items ?? []).map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime: startTime.slice(0, 5), endTime: endTime.slice(0, 5) })),
    [data]
  );

  const save = useMutation({
    mutationFn: (schedule: Pick<AvailabilityBlock, 'dayOfWeek' | 'startTime' | 'endTime'>[]) =>
      api.put<Items>(`/clinic/team/${member!.id}/availability`, { schedule }),
    onSuccess: (res) => {
      qc.setQueryData(key, res);
      qc.invalidateQueries({ queryKey: ['slots'] });
      toast.success(`Schedule saved for ${member?.user.name}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Sheet open={Boolean(member)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Weekly schedule</SheetTitle>
          <SheetDescription>{member ? `${member.user.name}'s bookable hours at this clinic` : ''}</SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
          ) : (
            <AvailabilityEditor initial={initial} timezone={timezone} saving={save.isPending} onSave={(s) => save.mutate(s)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
