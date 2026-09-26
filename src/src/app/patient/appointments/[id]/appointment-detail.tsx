'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, BellRing, CalendarClock, Download, ExternalLink, FileText, FileUp, Loader2, MapPin, Stethoscope, XCircle } from 'lucide-react';
import { ApiError, api, errorMessage, recordFileUrl } from '@/lib/api';
import { formatBytes, formatDateTime, formatTime, RECORD_TYPE_LABEL } from '@/lib/format';
import type { Appointment, RecordItem, Slot } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, StatusBadge } from '@/components/app/common';
import { ConfirmAction } from '@/components/app/confirm-action';
import { RecordUploadDialog } from '@/components/app/record-upload-dialog';
import { SlotPicker } from '@/components/app/slot-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apptLabel, apptTime, PK, RespondButtons, zoneSuffix } from '../../_components/shared';

type Detail = { appointment: Appointment; records: RecordItem[] };

function RescheduleDialog({ appointment: a, onDone }: { appointment: Appointment; onDone: () => void }) {
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (busy) return;
        setOpen(v);
        if (!v) setSlot(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarClock /> Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pick a new time</DialogTitle>
          <DialogDescription>
            Currently {apptTime(a.startsAt, tz)} with {a.doctor.name} at {a.clinic.name}.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <SlotPicker doctorId={a.doctor.id} clinicId={a.clinic.id} timezone={tz} value={slot?.startsAt ?? null} onChange={setSlot} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Back
          </Button>
          <Button onClick={submit} disabled={!slot || busy}>
            {busy && <Loader2 className="animate-spin" />}
            {slot ? `Move to ${formatTime(slot.startsAt, tz)}` : 'Choose a time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
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

  const back = (
    <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
      <Link href="/patient/appointments">
        <ArrowLeft /> All appointments
      </Link>
    </Button>
  );

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

  return (
    <>
      {back}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{a.doctor.name}</h1>
            <StatusBadge status={a.status} />
          </div>
          <p className="text-muted-foreground">
            {formatDateTime(a.startsAt, tz, { dateStyle: 'full', timeStyle: undefined })} · {formatTime(a.startsAt, tz)}–{formatTime(a.endsAt, tz)}
            {zoneSuffix(tz, a.startsAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReschedule && <RescheduleDialog appointment={a} onDone={refresh} />}
          {canCancel && (
            <ConfirmAction
              trigger={
                <Button variant="destructive">
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
      </div>

      {a.status === 'reschedule_proposed' && (
        <section aria-labelledby="proposal" className="mb-6 space-y-3 rounded-xl border border-sky-300/60 bg-sky-50 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
          <h2 id="proposal" className="flex items-center gap-2 font-medium">
            <BellRing className="size-4" /> The clinic proposed a new time
          </h2>
          <p className="text-sm">
            <span className="text-muted-foreground line-through">{apptTime(a.startsAt, tz)}</span>
            {a.proposedStartsAt && (
              <>
                {' → '}
                <span className="font-medium">{apptTime(a.proposedStartsAt, tz)}</span>
              </>
            )}
          </p>
          {a.rescheduleReason && <p className="text-sm text-muted-foreground">Reason: {a.rescheduleReason}</p>}
          <p className="text-xs text-muted-foreground">Accepting confirms the new time. Declining cancels this visit.</p>
          <RespondButtons appointment={a} />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Visit details</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <Row label="Doctor">
                  <span className="flex items-center gap-2">
                    <Stethoscope className="size-4 text-muted-foreground" />
                    {a.doctor.name}
                    {a.doctor.specialization && <span className="text-muted-foreground">· {a.doctor.specialization}</span>}
                  </span>
                </Row>
                <Row label="Clinic">
                  <span className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="block">{a.clinic.name}</span>
                      {address && <span className="block text-muted-foreground">{address}</span>}
                    </span>
                  </span>
                </Row>
                <Row label="When">{apptTime(a.startsAt, tz)}</Row>
                <Row label="Reason for visit">{a.reason || <span className="text-muted-foreground">Not provided</span>}</Row>
                <Row label="Booked">{apptTime(a.createdAt, tz)}</Row>
                {a.status === 'cancelled' && (
                  <Row label="Cancellation">
                    {a.cancelledBy === a.patient.id ? 'Cancelled by you' : 'Cancelled by the clinic'}
                    {a.cancellationReason && <span className="block text-muted-foreground">“{a.cancellationReason}”</span>}
                  </Row>
                )}
              </dl>
            </CardContent>
          </Card>

          {a.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>Clinical notes</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {a.clinicalNotes ? (
                  <p className="text-sm whitespace-pre-wrap">{a.clinicalNotes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Your doctor hasn’t added notes for this visit.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>
              <h2>Documents</h2>
            </CardTitle>
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
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <EmptyState icon={FileText} title="No documents attached" description="Attach reports or prescriptions so your doctor can review them." />
            ) : (
              <ul className="divide-y">
                {records.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {RECORD_TYPE_LABEL[r.recordType]} · {formatBytes(r.fileSize)}
                        {r.uploadedBy && ` · ${r.uploadedBy.role === 'patient' ? 'You' : r.uploadedBy.name}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <a href={recordFileUrl(r.id)} target="_blank" rel="noopener" aria-label={`Open ${r.title}`}>
                        <ExternalLink />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <a href={recordFileUrl(r.id, true)} aria-label={`Download ${r.title}`}>
                        <Download />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
