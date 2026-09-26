'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, CircleCheck, Loader2, UserX, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime, formatTime } from '@/lib/format';
import type { Appointment, Slot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmAction } from '@/components/app/confirm-action';
import { SlotPicker } from '@/components/app/slot-picker';
import { invalidateDoctor } from './hooks';

type Action = 'confirm' | 'cancel' | 'complete' | 'no-show' | 'propose';

const SUCCESS: Record<Action, string> = {
  confirm: 'Appointment confirmed',
  cancel: 'Appointment cancelled',
  complete: 'Visit marked as completed',
  'no-show': 'Marked as no-show',
  propose: 'New time proposed to the patient',
};

const EARLY_COMPLETE_MS = 15 * 60_000;

/** Rules mirror the API so we only offer actions that can succeed. */
export function availableActions(a: Appointment, now: number) {
  const start = new Date(a.startsAt).getTime();
  const future = start > now;
  const open = a.status === 'pending' || a.status === 'confirmed';
  return {
    confirm: a.status === 'pending' && future,
    cancel: (open || a.status === 'reschedule_proposed') && future,
    propose: open && future,
    complete: open,
    completeTooEarly: open && start - now > EARLY_COMPLETE_MS,
    noShow: open && !future,
    notes: a.status === 'confirmed' || a.status === 'completed',
  };
}

function tooEarlyMessage(a: Appointment) {
  const from = new Date(new Date(a.startsAt).getTime() - EARLY_COMPLETE_MS);
  return `You can complete this visit from 15 minutes before it starts (from ${formatTime(from, a.clinic.timezone)}).`;
}

/** Runs an appointment transition, toasts the outcome and refreshes doctor data. Rethrows so dialogs stay open. */
export function useAppointmentAction() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: ({ appt, action, body }: { appt: Appointment; action: Action; body?: unknown }) =>
      api.post<{ appointment: Appointment }>(`/doctor/appointments/${appt.id}/${action}`, body ?? {}),
    onSuccess: (_d, v) => {
      toast.success(SUCCESS[v.action]);
      void invalidateDoctor(qc);
    },
    onError: (err, v) => {
      if (err instanceof ApiError && err.code === 'TOO_EARLY' && v.action === 'complete') toast.error(tooEarlyMessage(v.appt));
      else toast.error(errorMessage(err));
    },
  });
  return { run: m.mutateAsync, pending: m.isPending, variables: m.variables };
}

type Size = 'sm' | 'default';

export function ConfirmButton({ appt, size = 'sm' }: { appt: Appointment; size?: Size }) {
  const { run, pending, variables } = useAppointmentAction();
  const busy = pending && variables?.appt.id === appt.id;
  return (
    <Button size={size} onClick={() => run({ appt, action: 'confirm' }).catch(() => undefined)} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Check />} Confirm
    </Button>
  );
}

export function CancelButton({ appt, size = 'sm' }: { appt: Appointment; size?: Size }) {
  const { run } = useAppointmentAction();
  return (
    <ConfirmAction
      trigger={
        <Button size={size} variant="outline">
          <X /> Cancel
        </Button>
      }
      title="Cancel this appointment?"
      description={`${appt.patient.name} · ${formatDateTime(appt.startsAt, appt.clinic.timezone)}. The patient will be notified.`}
      confirmLabel="Cancel appointment"
      destructive
      reason={{ label: 'Reason for the patient (optional)', placeholder: 'e.g. I am unavailable at this time' }}
      onConfirm={(reason) => run({ appt, action: 'cancel', body: { reason } })}
    />
  );
}

export function NoShowButton({ appt, size = 'sm' }: { appt: Appointment; size?: Size }) {
  const { run } = useAppointmentAction();
  return (
    <ConfirmAction
      trigger={
        <Button size={size} variant="ghost">
          <UserX /> No-show
        </Button>
      }
      title="Mark as no-show?"
      description={`${appt.patient.name} didn't attend the visit at ${formatTime(appt.startsAt, appt.clinic.timezone)}.`}
      confirmLabel="Mark no-show"
      destructive
      onConfirm={() => run({ appt, action: 'no-show' })}
    />
  );
}

export function CompleteDialog({ appt, size = 'sm', tooEarly }: { appt: Appointment; size?: Size; tooEarly?: boolean }) {
  const { run, pending } = useAppointmentAction();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(appt.clinicalNotes ?? '');

  const submit = async () => {
    try {
      await run({ appt, action: 'complete', body: { clinicalNotes: notes.trim() || undefined } });
      setOpen(false);
    } catch {
      // toast already shown
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (pending) return;
        if (v) setNotes(appt.clinicalNotes ?? '');
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button size={size} variant="secondary">
          <CircleCheck /> Complete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete visit</DialogTitle>
          <DialogDescription>
            {appt.patient.name} · {formatDateTime(appt.startsAt, appt.clinic.timezone)}
          </DialogDescription>
        </DialogHeader>
        {tooEarly && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{tooEarlyMessage(appt)}</p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`complete-notes-${appt.id}`}>Clinical notes</Label>
          <Textarea
            id={`complete-notes-${appt.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            maxLength={10000}
            placeholder="Findings, diagnosis, prescriptions, follow-up…"
          />
          <p className="text-xs text-muted-foreground">Clinical notes are visible to the patient.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Back
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Mark completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProposeDialog({ appt, size = 'sm' }: { appt: Appointment; size?: Size }) {
  const { run, pending } = useAppointmentAction();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');

  const submit = async () => {
    if (!slot) return;
    try {
      await run({ appt, action: 'propose', body: { startsAt: slot.startsAt, reason: reason.trim() || undefined } });
      setOpen(false);
    } catch {
      // toast already shown
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (pending) return;
        if (v) {
          setSlot(null);
          setReason('');
        }
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button size={size} variant="outline">
          <CalendarClock /> Propose new time
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Propose a new time</DialogTitle>
          <DialogDescription>
            Currently {formatDateTime(appt.startsAt, appt.clinic.timezone)} at {appt.clinic.name}. The patient can accept or decline.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <SlotPicker doctorId={appt.doctor.id} clinicId={appt.clinic.id} timezone={appt.clinic.timezone} value={slot?.startsAt ?? null} onChange={setSlot} />
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`propose-reason-${appt.id}`}>Message to the patient (optional)</Label>
          <Textarea
            id={`propose-reason-${appt.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="e.g. I'm in surgery that morning"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Back
          </Button>
          <Button onClick={submit} disabled={!slot || pending}>
            {pending && <Loader2 className="animate-spin" />}
            {slot ? `Propose ${formatDateTime(slot.startsAt, appt.clinic.timezone)}` : 'Pick a time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
