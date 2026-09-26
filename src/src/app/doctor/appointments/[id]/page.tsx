'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarClock, CalendarDays, CircleCheck, Clock, FileText, History, Loader2, MapPin, MessageSquareText, NotebookPen, Upload, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, formatTime } from '@/lib/format';
import type { Appointment, Paged, RecordItem } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, SectionHeader, StatusBadge } from '@/components/app/common';
import { RecordUploadDialog } from '@/components/app/record-upload-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  availableActions,
  CancelButton,
  CompleteDialog,
  ConfirmButton,
  NoShowButton,
  ProposeDialog,
} from '../../_components/appointment-actions';
import { BackLink, IconCircle, InfoTile, PersonAvatar, RecordsList, ZoneHint } from '../../_components/bits';
import { invalidateDoctor, useNow, type ClinicalPatient } from '../../_components/hooks';
import { PatientCard } from '../../_components/patient-card';

type Detail = { appointment: Appointment; patient: ClinicalPatient | null; history: Appointment[] };

function NotesEditor({ appt }: { appt: Appointment }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(appt.clinicalNotes ?? '');
  const save = useMutation({
    mutationFn: () => api.put<{ appointment: Appointment }>(`/doctor/appointments/${appt.id}/notes`, { clinicalNotes: notes }),
    onSuccess: () => {
      toast.success('Clinical notes saved');
      void invalidateDoctor(qc);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const dirty = notes.trim() !== (appt.clinicalNotes ?? '').trim();

  return (
    <section className="rounded-3xl bg-card p-5" aria-labelledby="notes-title">
      <div className="mb-4 flex items-center gap-3">
        <IconCircle icon={NotebookPen} />
        <div>
          <h2 id="notes-title" className="font-semibold">
            Clinical notes
          </h2>
          <p className="text-xs text-muted-foreground">Visible to the patient.</p>
        </div>
      </div>
      <Label htmlFor="clinical-notes" className="sr-only">
        Clinical notes
      </Label>
      <Textarea
        id="clinical-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={8}
        maxLength={10000}
        placeholder="Findings, diagnosis, prescriptions, follow-up…"
        className="rounded-2xl bg-background"
      />
      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        {dirty && <span className="text-center text-xs text-muted-foreground">Unsaved changes</span>}
        <Button size="lg" className="h-11" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />}
          Save notes
        </Button>
      </div>
    </section>
  );
}

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const now = useNow();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor', 'appointment', id],
    queryFn: () => api.get<Detail>(`/doctor/appointments/${id}`),
  });
  const patientId = data?.appointment.patient.id;
  const records = useQuery({
    queryKey: ['doctor', 'records', { patientId }],
    queryFn: () => api.get<Paged<RecordItem>>('/doctor/records', { patientId, pageSize: 50 }),
    enabled: Boolean(patientId),
  });

  const back = <BackLink href="/doctor/appointments" label="Visits" />;

  if (error)
    return (
      <>
        {back}
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      </>
    );
  if (isLoading || !data)
    return (
      <>
        {back}
        <Skeleton className="mb-4 h-40 rounded-3xl" />
        <ListSkeleton rows={4} />
      </>
    );

  const { appointment: a, patient, history } = data;
  const tz = a.clinic.timezone;
  const acts = availableActions(a, now);
  const others = history.filter((h) => h.id !== a.id);
  const linked = (records.data?.items ?? []).filter((r) => r.appointmentId === a.id);
  const otherRecords = (records.data?.items ?? []).filter((r) => r.appointmentId !== a.id);
  const cancelledBy =
    a.cancelledBy === a.patient.id ? 'the patient' : a.cancelledBy === a.doctor.id ? 'you' : a.cancelledBy ? 'the clinic' : null;
  const hasActions = acts.confirm || acts.complete || acts.propose || acts.noShow || acts.cancel;
  const secondaryCount = [acts.propose, acts.noShow, acts.cancel].filter(Boolean).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        {hasActions && (
          <div className="mb-5 hidden flex-wrap gap-2 lg:flex">
            {acts.confirm && <ConfirmButton appt={a} size="lg" />}
            {acts.complete && <CompleteDialog appt={a} size="lg" variant={acts.confirm ? 'secondary' : 'default'} tooEarly={acts.completeTooEarly} />}
            {acts.propose && <ProposeDialog appt={a} size="lg" />}
            {acts.noShow && <NoShowButton appt={a} size="lg" />}
            {acts.cancel && <CancelButton appt={a} size="lg" />}
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:gap-8">
        {/* Patient header */}
        <div className="lg:col-start-3 lg:row-start-1">
          {patient ? (
            <PatientCard patient={patient} linkToChart headingLevel={1} />
          ) : (
            <section className="flex items-center gap-3 rounded-3xl bg-card p-5">
              <PersonAvatar name={a.patient.name} src={a.patient.avatarUrl} className="size-14" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight">{a.patient.name}</h1>
                <p className="truncate text-sm text-muted-foreground">{a.patient.email}</p>
              </div>
            </section>
          )}
        </div>

        {/* Visit */}
        <div className="space-y-6 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <section aria-labelledby="appt-title" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="appt-title" className="text-lg font-semibold tracking-tight">
                Appointment
              </h2>
              <StatusBadge status={a.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={CalendarDays} label="Date">
                {formatDate(a.startsAt, tz)}
              </InfoTile>
              <InfoTile icon={Clock} label="Time">
                <span className="tabular-nums">
                  {formatTime(a.startsAt, tz)} – {formatTime(a.endsAt, tz)}
                </span>
                <ZoneHint timezone={tz} />
              </InfoTile>
              <InfoTile icon={MapPin} label="Clinic" className="col-span-2">
                <span className="block truncate">{a.clinic.name}</span>
                {(a.clinic.address || a.clinic.city) && (
                  <span className="block truncate text-xs font-normal text-muted-foreground">{[a.clinic.address, a.clinic.city].filter(Boolean).join(', ')}</span>
                )}
              </InfoTile>
              <InfoTile icon={CalendarClock} label="Booked" className={a.confirmedAt || a.completedAt ? undefined : 'col-span-2'}>
                {formatDateTime(a.createdAt, tz)}
              </InfoTile>
              {a.completedAt ? (
                <InfoTile icon={CircleCheck} label="Completed">
                  {formatDateTime(a.completedAt, tz)}
                </InfoTile>
              ) : a.confirmedAt ? (
                <InfoTile icon={CalendarCheck} label="Confirmed">
                  {formatDateTime(a.confirmedAt, tz)}
                </InfoTile>
              ) : null}
            </div>

            {a.status === 'reschedule_proposed' && a.proposedStartsAt && (
              <div className="flex gap-3 rounded-3xl bg-accent p-4 text-accent-foreground">
                <CalendarClock className="mt-0.5 size-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Proposed {formatDateTime(a.proposedStartsAt, tz)}</p>
                  <p>Waiting for the patient to respond.</p>
                  {a.rescheduleReason && <p className="mt-1">&ldquo;{a.rescheduleReason}&rdquo;</p>}
                </div>
              </div>
            )}
            {a.status === 'cancelled' && (
              <div className="flex gap-3 rounded-3xl bg-card p-4">
                <XCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-semibold">{cancelledBy ? `Cancelled by ${cancelledBy}` : 'Cancelled'}</p>
                  {a.cancellationReason && <p className="text-muted-foreground">&ldquo;{a.cancellationReason}&rdquo;</p>}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-card p-5" aria-labelledby="reason-title">
            <div className="flex items-center gap-3">
              <IconCircle icon={MessageSquareText} />
              <h2 id="reason-title" className="font-semibold">
                Reason for visit
              </h2>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{a.reason || <span className="text-muted-foreground">No reason given</span>}</p>
          </section>

          {acts.notes ? (
            <NotesEditor key={`${a.id}:${a.clinicalNotes ?? ''}`} appt={a} />
          ) : a.clinicalNotes ? (
            <section className="rounded-3xl bg-card p-5" aria-labelledby="notes-title">
              <div className="flex items-center gap-3">
                <IconCircle icon={NotebookPen} />
                <h2 id="notes-title" className="font-semibold">
                  Clinical notes
                </h2>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap">{a.clinicalNotes}</p>
            </section>
          ) : null}

          <section aria-labelledby="records-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="records-title" className="text-lg font-semibold tracking-tight">
                Records
              </h2>
              <RecordUploadDialog
                base="/doctor"
                patientId={a.patient.id}
                defaultAppointmentId={a.id}
                appointments={[{ id: a.id, label: `This visit · ${formatDate(a.startsAt, tz)}` }]}
                onUploaded={() => qc.invalidateQueries({ queryKey: ['doctor', 'records'] })}
                trigger={
                  <Button variant="outline">
                    <Upload /> Upload
                  </Button>
                }
              />
            </div>
            {records.error ? (
              <ErrorState message={errorMessage(records.error)} onRetry={() => records.refetch()} />
            ) : records.isLoading ? (
              <ListSkeleton rows={2} />
            ) : (records.data?.items.length ?? 0) === 0 ? (
              <EmptyState icon={FileText} title="No records available" description="Documents shared by the patient or uploaded by you will appear here." />
            ) : (
              <div className="space-y-5">
                {linked.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">Shared with this visit</h3>
                    <RecordsList records={linked} />
                  </div>
                )}
                {otherRecords.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">Other records for this patient</h3>
                    <RecordsList records={otherRecords} />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* History */}
        <section aria-labelledby="history-title" className="lg:col-start-3 lg:row-start-2">
          <SectionHeader title="History with you" />
          <h2 id="history-title" className="sr-only">
            History with you
          </h2>
          {others.length === 0 ? (
            <div className="flex items-center gap-3 rounded-3xl bg-card p-4">
              <IconCircle icon={History} muted />
              <p className="text-sm text-muted-foreground">This is the first visit with you.</p>
            </div>
          ) : (
            <ul className="divide-y rounded-3xl bg-card px-4">
              {others.map((h) => (
                <li key={h.id}>
                  <Link href={`/doctor/appointments/${h.id}`} className="flex items-center gap-3 py-3.5 hover:opacity-80">
                    <IconCircle icon={CalendarDays} muted />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{formatDate(h.startsAt, h.clinic.timezone)}</p>
                      <p className="truncate text-xs text-muted-foreground">{h.reason || 'No reason given'}</p>
                    </div>
                    <StatusBadge status={h.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Mobile action bar */}
      {hasActions && (
        <div className="sticky bottom-24 z-10 mt-6 space-y-2 rounded-3xl bg-card p-2 ring-1 ring-border lg:hidden">
          {acts.confirm && <ConfirmButton appt={a} size="lg" className="h-12 w-full" label="Confirm visit" />}
          {acts.complete && (
            <CompleteDialog appt={a} size="lg" variant={acts.confirm ? 'secondary' : 'default'} className="h-12 w-full" tooEarly={acts.completeTooEarly} />
          )}
          {secondaryCount > 0 && (
            <div className="flex gap-2">
              {acts.propose && <ProposeDialog appt={a} size="lg" className="h-11 min-w-0 flex-1" />}
              {acts.noShow && <NoShowButton appt={a} size="lg" className="h-11 min-w-0 flex-1" />}
              {acts.cancel && <CancelButton appt={a} size="lg" className="h-11 min-w-0 flex-1" />}
            </div>
          )}
        </div>
      )}
    </>
  );
}
