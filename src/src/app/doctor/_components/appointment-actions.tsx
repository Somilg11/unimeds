'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, CircleCheck, Clock, Loader2, UserX, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime, formatTime } from '@/lib/format';
import type { Appointment, Slot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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

/** Bottom sheet frame: rounded top, capped height, centred on wide screens. */
const SHEET_CLASS = 'mx-auto max-h-[92dvh] w-full max-w-2xl gap-0 overflow-y-auto rounded-t-3xl border-0 pb-[env(safe-area-inset-bottom)]';

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

type Size = 'sm' | 'default' | 'lg';
type BtnProps = { appt: Appointment; size?: Size; className?: string };

export function ConfirmButton({ appt, size = 'sm', className, label = 'Confirm' }: BtnProps & { label?: string }) {
  const { run, pending, variables } = useAppointmentAction();
  const busy = pending && variables?.appt.id === appt.id;
  return (
    <Button size={size} className={className} onClick={() => run({ appt, action: 'confirm' }).catch(() => undefined)} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Check />} {label}
    </Button>
  );
}

export function CancelButton({ appt, size = 'sm', className, label = 'Cancel' }: BtnProps & { label?: string }) {
  const { run } = useAppointmentAction();
  return (
    <ConfirmAction
      trigger={
        <Button size={size} variant="outline" className={className}>
          <X /> {label}
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

export function NoShowButton({ appt, size = 'sm', className }: BtnProps) {
  const { run } = useAppointmentAction();
  return (
    <ConfirmAction
      trigger={
        <Button size={size} variant="outline" className={className}>
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

export function CompleteDialog({
  appt,
  size = 'sm',
  tooEarly,
  className,
  variant = 'secondary',
}: BtnProps & { tooEarly?: boolean; variant?: 'default' | 'secondary' | 'outline' }) {
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
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (pending) return;
        if (v) setNotes(appt.clinicalNotes ?? '');
        setOpen(v);
      }}
    >
      <SheetTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          <CircleCheck /> Complete
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className={SHEET_CLASS}>
        <SheetHeader className="px-5 pt-6 pb-4 sm:px-6">
          <SheetTitle className="text-lg font-semibold">Complete visit</SheetTitle>
          <SheetDescription>
            {appt.patient.name} · {formatDateTime(appt.startsAt, appt.clinic.timezone)}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-5 sm:px-6">
          {tooEarly && (
            <p className="flex gap-2 rounded-2xl bg-accent px-4 py-3 text-sm text-accent-foreground">
              <Clock className="mt-0.5 size-4 shrink-0" />
              {tooEarlyMessage(appt)}
            </p>
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
              className="rounded-2xl"
            />
            <p className="text-xs text-muted-foreground">Clinical notes are visible to the patient.</p>
          </div>
        </div>
        <SheetFooter className="grid grid-cols-2 gap-2 px-5 pt-5 pb-6 sm:px-6">
          <Button size="lg" variant="outline" className="h-12" onClick={() => setOpen(false)} disabled={pending}>
            Back
          </Button>
          <Button size="lg" className="h-12" onClick={submit} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Mark completed
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ProposeDialog({ appt, size = 'sm', className }: BtnProps) {
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
    <Sheet
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
      <SheetTrigger asChild>
        <Button size={size} variant="outline" className={className}>
          <CalendarClock /> Propose new time
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className={SHEET_CLASS}>
        <SheetHeader className="px-5 pt-6 pb-4 sm:px-6">
          <SheetTitle className="text-lg font-semibold">Propose a new time</SheetTitle>
          <SheetDescription>
            Currently {formatDateTime(appt.startsAt, appt.clinic.timezone)} at {appt.clinic.name}. The patient can accept or decline.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5 sm:px-6">
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
              className="rounded-2xl"
            />
          </div>
        </div>
        <SheetFooter className={cn('sticky bottom-0 grid grid-cols-[auto_1fr] gap-2 bg-popover px-5 pt-4 pb-6 sm:px-6')}>
          <Button size="lg" variant="outline" className="h-12" onClick={() => setOpen(false)} disabled={pending}>
            Back
          </Button>
          <Button size="lg" className="h-12 min-w-0" onClick={submit} disabled={!slot || pending}>
            {pending && <Loader2 className="animate-spin" />}
            <span className="truncate">{slot ? `Propose ${formatDateTime(slot.startsAt, appt.clinic.timezone)}` : 'Pick a time'}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
