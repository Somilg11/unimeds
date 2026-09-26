'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BellRing, CalendarClock, CalendarDays, Clock, Download, ExternalLink, FileText, FileUp, Loader2, MapPin, NotebookPen, Stethoscope, XCircle } from 'lucide-react';
import { ApiError, api, errorMessage, recordFileUrl } from '@/lib/api';
import { formatBytes, formatDate, formatDateTime, formatTime, RECORD_TYPE_LABEL } from '@/lib/format';
import type { Appointment, RecordItem, Slot } from '@/lib/types';
import { ErrorState, ListSkeleton, StatusBadge } from '@/components/app/common';
import { ConfirmAction } from '@/components/app/confirm-action';
import { RecordUploadDialog } from '@/components/app/record-upload-dialog';
import { SlotPicker } from '@/components/app/slot-picker';
import { Button } from '@/components/ui/button';
import { BackBar, IconCircle, InfoTile, Panel, PersonAvatar } from '../../_components/bits';
import { ResponsiveDialog } from '@/components/app/responsive-dialog';
import { apptLabel, apptTime, PK, RespondButtons, zoneSuffix } from '../../_components/shared';

type Detail = { appointment: Appointment; records: RecordItem[] };

function RescheduleButton({ appointment: a, onDone, className }: { appointment: Appointment; onDone: () => void; className?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const tz = a.clinic.timezone;

  const submit = async () => {
    if (!slot) return;
    setBusy(true);
    try {
      await api.post<{ appointment: Appointment }>(`/patient/appointments/${a.id}/reschedule`, { startsAt: slot.startsAt });
      toast.success(`Moved to ${apptTime(slot.startsAt, tz)}`);
      setOpen(false);
      setSlot(null);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
      if (err instanceof ApiError && err.code === 'SLOT_UNAVAILABLE') setSlot(null);
    } finally {
      setBusy(false);
      void qc.invalidateQueries({ queryKey: ['slots', a.doctor.id, a.clinic.id] });
    }
  };

  return (
    <>
      <Button variant="outline" size="lg" className={className} onClick={() => setOpen(true)}>
        <CalendarClock /> Reschedule
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={(v) => {
          if (busy) return;
          setOpen(v);
          if (!v) setSlot(null);
        }}
        title="Pick a new time"
        description={`Currently ${apptTime(a.startsAt, tz)} with ${a.doctor.name} at ${a.clinic.name}.`}
        className="sm:max-w-2xl"
      >
        <div className="space-y-5">
          {open && <SlotPicker doctorId={a.doctor.id} clinicId={a.clinic.id} timezone={tz} value={slot?.startsAt ?? null} onChange={setSlot} />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" size="lg" className="h-12 sm:h-10" onClick={() => setOpen(false)} disabled={busy}>
              Back
            </Button>
            <Button size="lg" className="h-12 sm:h-10" onClick={submit} disabled={!slot || busy}>
              {busy && <Loader2 className="animate-spin" />}
              {slot ? `Move to ${formatTime(slot.startsAt, tz)}` : 'Choose a time'}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [now] = useState(() => Date.now());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: PK.appointment(id),
    queryFn: () => api.get<Detail>(`/patient/appointments/${id}`),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: PK.all });
    void qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const back = <BackBar title="Appointment" href="/patient/appointments" label="All appointments" />;

  if (isLoading) {
    return (
      <>
        {back}
        <ListSkeleton rows={4} />
      </>
    );
  }
  if (isError || !data) {
    return (
      <>
        {back}
        <ErrorState
          message={error instanceof ApiError && error.status === 404 ? 'We couldn’t find this appointment.' : errorMessage(error)}
          onRetry={() => void refetch()}
        />
      </>
    );
  }

  const { appointment: a, records } = data;
  const tz = a.clinic.timezone;
  const upcoming = new Date(a.startsAt).getTime() > now;
  const canReschedule = upcoming && (a.status === 'pending' || a.status === 'confirmed');
  const canCancel = upcoming && (a.status === 'pending' || a.status === 'confirmed' || a.status === 'reschedule_proposed');
  const address = [a.clinic.address, a.clinic.city].filter(Boolean).join(', ');

  const cancel = async (reason?: string) => {
    try {
      await api.post(`/patient/appointments/${a.id}/cancel`, reason ? { reason } : {});
      toast.success('Appointment cancelled');
      refresh();
    } catch (err) {
      toast.error(errorMessage(err), err instanceof ApiError && err.code === 'CANCELLATION_WINDOW' ? { duration: 8000 } : undefined);
      throw err;
    }
  };

  const hasActions = canReschedule || canCancel;
  const actions = (
    <div className="flex flex-col gap-2">
      {canReschedule && <RescheduleButton appointment={a} onDone={refresh} className="h-12 w-full" />}
      {canCancel && (
        <ConfirmAction
          trigger={
            <Button variant="destructive" size="lg" className="h-12 w-full">
              <XCircle /> Cancel visit
            </Button>
          }
          title="Cancel this appointment?"
          description={`${a.doctor.name} at ${a.clinic.name}, ${apptTime(a.startsAt, tz)}. The clinic will be notified.`}
          confirmLabel="Cancel appointment"
          destructive
          reason={{ label: 'Reason (optional)', placeholder: 'Let the clinic know why you’re cancelling' }}
          onConfirm={cancel}
        />
      )}
    </div>
  );

  return (
    <>
      {back}
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        <div className="space-y-4 lg:col-span-3">
          <section aria-labelledby="doctor-name" className="rounded-3xl bg-card p-6 text-center">
            <PersonAvatar name={a.doctor.name} src={a.doctor.avatarUrl} className="mx-auto size-20 [&_[data-slot=avatar-fallback]]:text-xl" />
            <h2 id="doctor-name" className="mt-4 text-xl font-bold tracking-tight">
              {a.doctor.name}
            </h2>
            <p className="text-sm text-muted-foreground">{a.doctor.specialization ?? 'Doctor'}</p>
            <div className="mt-3 flex justify-center">
              <StatusBadge status={a.status} />
            </div>
          </section>

          {a.status === 'reschedule_proposed' && (
            <section aria-labelledby="proposal" className="space-y-3 rounded-3xl border-2 border-primary/30 bg-card p-5">
              <h2 id="proposal" className="flex items-center gap-3 font-semibold">
                <IconCircle icon={BellRing} /> The clinic proposed a new time
              </h2>
              <div className="text-sm">
                <p className="text-muted-foreground line-through">{apptTime(a.startsAt, tz)}</p>
                {a.proposedStartsAt && <p className="font-semibold">{apptTime(a.proposedStartsAt, tz)}</p>}
              </div>
              {a.rescheduleReason && <p className="text-sm text-muted-foreground">“{a.rescheduleReason}”</p>}
              <p className="text-xs text-muted-foreground">Accepting confirms the new time. Declining cancels this visit.</p>
              <RespondButtons appointment={a} size="default" />
            </section>
          )}

          <div className="grid grid-cols-2 gap-3">
            <InfoTile icon={CalendarDays} label="Date">
              {formatDate(a.startsAt, tz)}
              <span className="block text-xs font-normal text-muted-foreground">{formatDateTime(a.startsAt, tz, { weekday: 'long', dateStyle: undefined, timeStyle: undefined })}</span>
            </InfoTile>
            <InfoTile icon={Clock} label="Time">
              <span className="tabular-nums">
                {formatTime(a.startsAt, tz)}–{formatTime(a.endsAt, tz)}
              </span>
              {zoneSuffix(tz, a.startsAt) && <span className="block text-xs font-normal text-muted-foreground">{zoneSuffix(tz, a.startsAt).trim()}</span>}
            </InfoTile>
            <InfoTile icon={MapPin} label="Clinic" className="col-span-2">
              {a.clinic.name}
              {address && <span className="mt-0.5 block font-normal text-muted-foreground">{address}</span>}
            </InfoTile>
          </div>

          {hasActions && <div className="lg:hidden">{actions}</div>}

          <Panel title="Visit details" icon={Stethoscope} id="visit-details">
            <dl className="divide-y">
              <DetailRow label="Reason for visit">{a.reason || <span className="text-muted-foreground">Not provided</span>}</DetailRow>
              <DetailRow label="Booked">{apptTime(a.createdAt, tz)}</DetailRow>
              {a.status === 'cancelled' && (
                <DetailRow label="Cancellation">
                  {a.cancelledBy === a.patient.id ? 'Cancelled by you' : 'Cancelled by the clinic'}
                  {a.cancellationReason && <span className="block text-muted-foreground">“{a.cancellationReason}”</span>}
                </DetailRow>
              )}
            </dl>
          </Panel>

          {a.status === 'completed' && (
            <Panel title="Clinical notes" icon={NotebookPen} id="clinical-notes">
              {a.clinicalNotes ? (
                <p className="text-sm whitespace-pre-wrap">{a.clinicalNotes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Your doctor hasn’t added notes for this visit.</p>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          {hasActions && <div className="hidden rounded-3xl bg-card p-5 lg:block">{actions}</div>}

          <Panel
            title="Documents"
            icon={FileText}
            id="documents"
            action={
              <RecordUploadDialog
                base="/patient"
                appointments={[{ id: a.id, label: apptLabel(a) }]}
                defaultAppointmentId={a.id}
                onUploaded={refresh}
                trigger={
                  <Button size="sm" variant="outline">
                    <FileUp /> Upload
                  </Button>
                }
              />
            }
          >
            {records.length === 0 ? (
              <p className="rounded-2xl bg-background px-4 py-6 text-center text-sm text-muted-foreground">
                No documents attached. Add reports or prescriptions so your doctor can review them.
              </p>
            ) : (
              <ul className="divide-y">
                {records.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <IconCircle icon={FileText} tone="muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {RECORD_TYPE_LABEL[r.recordType]} · {formatBytes(r.fileSize)}
                        {r.uploadedBy && ` · ${r.uploadedBy.role === 'patient' ? 'You' : r.uploadedBy.name}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="size-10">
                      <a href={recordFileUrl(r.id)} target="_blank" rel="noopener" aria-label={`Open ${r.title}`}>
                        <ExternalLink />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild className="size-10">
                      <a href={recordFileUrl(r.id, true)} aria-label={`Download ${r.title}`}>
                        <Download />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
