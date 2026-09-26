'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarClock, Check, Loader2, UserX, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Appointment, Slot } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmAction } from '@/components/app/confirm-action';
import { SlotPicker } from '@/components/app/slot-picker';

type Resp = { appointment: Appointment };

/** Mutations on a single appointment; every success refreshes all clinic data except the profile. */
export function useAppointmentMutations() {
  const qc = useQueryClient();
  const refresh = () =>
    qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'clinic' && q.queryKey[1] !== 'profile' && q.queryKey[1] !== 'team' });
  const onError = (err: unknown) => toast.error(errorMessage(err));
  const opts = { onError, onSettled: refresh };

  return {
    confirm: useMutation({
      mutationFn: (id: string) => api.post<Resp>(`/clinic/appointments/${id}/confirm`),
      onSuccess: () => toast.success('Appointment confirmed'),
      ...opts,
    }),
    cancel: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.post<Resp>(`/clinic/appointments/${id}/cancel`, { reason }),
      onSuccess: () => toast.success('Appointment cancelled'),
      ...opts,
    }),
    noShow: useMutation({
      mutationFn: (id: string) => api.post<Resp>(`/clinic/appointments/${id}/no-show`),
      onSuccess: () => toast.success('Marked as no-show'),
      ...opts,
    }),
    propose: useMutation({
      mutationFn: ({ id, startsAt, reason }: { id: string; startsAt: string; reason?: string }) =>
        api.post<Resp>(`/clinic/appointments/${id}/propose`, { startsAt, reason }),
      onSuccess: () => toast.success('New time proposed to the patient'),
      ...opts,
    }),
  };
}

function ProposeDialog({ appointment, open, onOpenChange }: { appointment: Appointment; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { propose } = useAppointmentMutations();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const tz = appointment.clinic.timezone;

  const submit = () => {
    if (!slot) return;
    propose.mutate(
      { id: appointment.id, startsAt: slot.startsAt, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSlot(null);
          setReason('');
        },
        onError: (err) => {
          // The slot may have just been taken: clear the selection so a fresh one is picked
          if (err && typeof err === 'object' && 'code' in err && err.code === 'SLOT_UNAVAILABLE') setSlot(null);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !propose.isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Propose a new time</DialogTitle>
          <DialogDescription>
            {appointment.patient.name} with {appointment.doctor.name} is currently booked for {formatDateTime(appointment.startsAt, tz)}. The patient will be
            asked to accept or decline.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <SlotPicker doctorId={appointment.doctor.id} clinicId={appointment.clinic.id} timezone={tz} value={slot?.startsAt ?? null} onChange={setSlot} />
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`propose-reason-${appointment.id}`}>Message to the patient (optional)</Label>
          <Textarea
            id={`propose-reason-${appointment.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="e.g. The doctor is in surgery that morning"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={propose.isPending}>
            Back
          </Button>
          <Button onClick={submit} disabled={!slot || propose.isPending}>
            {propose.isPending && <Loader2 className="animate-spin" />}
            {slot ? `Propose ${formatDateTime(slot.startsAt, tz)}` : 'Pick a time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Status-aware action buttons for one appointment. */
export function AppointmentActions({
  appointment: a,
  size = 'sm',
  mode = 'full',
}: {
  appointment: Appointment;
  size?: 'sm' | 'xs' | 'default';
  /** 'decision' shows only Confirm / Decline (cancel), for the awaiting-confirmation queue */
  mode?: 'full' | 'decision';
}) {
  const m = useAppointmentMutations();
  const [proposeOpen, setProposeOpen] = useState(false);
  // eslint-disable-next-line react-hooks/purity -- a render-time clock is fine for toggling the no-show button
  const started = new Date(a.startsAt).getTime() <= Date.now();
  const canConfirm = a.status === 'pending';
  const full = mode === 'full';
  const canPropose = full && (a.status === 'pending' || a.status === 'confirmed') && !started;
  const canNoShow = full && (a.status === 'pending' || a.status === 'confirmed') && started;
  const canCancel = a.status === 'pending' || a.status === 'confirmed' || a.status === 'reschedule_proposed';

  if (!canConfirm && !canPropose && !canNoShow && !canCancel) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canConfirm && (
        <Button size={size} onClick={() => m.confirm.mutate(a.id)} disabled={m.confirm.isPending}>
          {m.confirm.isPending ? <Loader2 className="animate-spin" /> : <Check />}
          Confirm
        </Button>
      )}
      {canPropose && (
        <>
          <Button size={size} variant="outline" onClick={() => setProposeOpen(true)}>
            <CalendarClock /> New time
          </Button>
          <ProposeDialog appointment={a} open={proposeOpen} onOpenChange={setProposeOpen} />
        </>
      )}
      {canNoShow && (
        <ConfirmAction
          trigger={
            <Button size={size} variant="outline">
              <UserX /> No-show
            </Button>
          }
          title="Mark as no-show?"
          description={`${a.patient.name} didn't attend the visit at ${formatDateTime(a.startsAt, a.clinic.timezone)}.`}
          confirmLabel="Mark no-show"
          onConfirm={() => m.noShow.mutateAsync(a.id)}
        />
      )}
      {canCancel && (
        <ConfirmAction
          trigger={
            <Button size={size} variant={full ? 'ghost' : 'outline'} className="text-destructive hover:text-destructive">
              <X /> {full ? 'Cancel' : 'Decline'}
            </Button>
          }
          title={full ? 'Cancel this appointment?' : 'Decline this booking request?'}
          description={`${a.patient.name} with ${a.doctor.name}, ${formatDateTime(a.startsAt, a.clinic.timezone)}. The patient and doctor will be notified.`}
          confirmLabel={full ? 'Cancel appointment' : 'Decline request'}
          destructive
          reason={{ label: 'Reason (shared with the patient)', placeholder: 'e.g. The doctor is unavailable' }}
          onConfirm={(reason) => m.cancel.mutateAsync({ id: a.id, reason })}
        />
      )}
    </div>
  );
}
