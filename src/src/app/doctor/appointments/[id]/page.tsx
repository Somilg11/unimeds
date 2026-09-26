'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, History, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, formatTime, formatWeekday } from '@/lib/format';
import type { Appointment, Paged, RecordItem } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, StatusBadge } from '@/components/app/common';
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
import { RecordsList, ZoneHint } from '../../_components/bits';
import { invalidateDoctor, useNow, type ClinicalPatient } from '../../_components/hooks';
import { PatientCard } from '../../_components/patient-card';

type Detail = { appointment: Appointment; patient: ClinicalPatient | null; history: Appointment[] };

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm sm:col-span-2">{children}</dd>
    </div>
  );
}

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
    <section className="rounded-xl border bg-card p-5" aria-labelledby="notes-title">
      <h2 id="notes-title" className="font-semibold">
        Clinical notes
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">Visible to the patient.</p>
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
      />
      <div className="mt-3 flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
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

  const back = (
    <Link href="/doctor/appointments" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Appointments
    </Link>
  );

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
        <Skeleton className="mb-8 h-10 w-72" />
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

  return (
    <>
      {back}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{a.patient.name}</h1>
            <StatusBadge status={a.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatWeekday(a.startsAt, tz)} · {formatTime(a.startsAt, tz)} – {formatTime(a.endsAt, tz)}
            <ZoneHint timezone={tz} /> · {a.clinic.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {acts.confirm && <ConfirmButton appt={a} size="default" />}
          {acts.complete && <CompleteDialog appt={a} size="default" tooEarly={acts.completeTooEarly} />}
          {acts.propose && <ProposeDialog appt={a} size="default" />}
          {acts.noShow && <NoShowButton appt={a} size="default" />}
          {acts.cancel && <CancelButton appt={a} size="default" />}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-xl border bg-card p-5" aria-labelledby="appt-title">
            <h2 id="appt-title" className="mb-4 font-semibold">
              Appointment
            </h2>
            <dl className="space-y-3">
              <InfoRow label="When">
                {formatDateTime(a.startsAt, tz)}
                <ZoneHint timezone={tz} />
              </InfoRow>
              <InfoRow label="Clinic">
                {a.clinic.name}
                {(a.clinic.address || a.clinic.city) && (
                  <span className="text-muted-foreground"> · {[a.clinic.address, a.clinic.city].filter(Boolean).join(', ')}</span>
                )}
              </InfoRow>
              <InfoRow label="Booked">{formatDateTime(a.createdAt, tz)}</InfoRow>
              {a.confirmedAt && <InfoRow label="Confirmed">{formatDateTime(a.confirmedAt, tz)}</InfoRow>}
              {a.completedAt && <InfoRow label="Completed">{formatDateTime(a.completedAt, tz)}</InfoRow>}
              {a.status === 'reschedule_proposed' && a.proposedStartsAt && (
                <InfoRow label="Proposed time">
                  <span className="font-medium">{formatDateTime(a.proposedStartsAt, tz)}</span>
                  <span className="text-muted-foreground"> · waiting for the patient</span>
                  {a.rescheduleReason && <p className="text-muted-foreground">&ldquo;{a.rescheduleReason}&rdquo;</p>}
                </InfoRow>
              )}
              {a.status === 'cancelled' && (
                <InfoRow label="Cancelled">
                  {cancelledBy ? `By ${cancelledBy}` : 'Cancelled'}
                  {a.cancellationReason && <span className="text-muted-foreground"> · &ldquo;{a.cancellationReason}&rdquo;</span>}
                </InfoRow>
              )}
            </dl>
            <div className="mt-5 border-t pt-4">
              <p className="text-sm text-muted-foreground">Patient&apos;s reason for visit</p>
              <p className="mt-1 whitespace-pre-wrap">{a.reason || <span className="text-muted-foreground">No reason given</span>}</p>
            </div>
            {!acts.notes && a.clinicalNotes && (
              <div className="mt-5 border-t pt-4">
                <p className="text-sm text-muted-foreground">Clinical notes</p>
                <p className="mt-1 whitespace-pre-wrap">{a.clinicalNotes}</p>
              </div>
            )}
          </section>

          {acts.notes && <NotesEditor key={`${a.id}:${a.clinicalNotes ?? ''}`} appt={a} />}

          <section aria-labelledby="records-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="records-title" className="text-lg font-semibold">
                Records
              </h2>
              <RecordUploadDialog
                base="/doctor"
                patientId={a.patient.id}
                defaultAppointmentId={a.id}
                appointments={[{ id: a.id, label: `This visit · ${formatDate(a.startsAt, tz)}` }]}
                onUploaded={() => qc.invalidateQueries({ queryKey: ['doctor', 'records'] })}
              />
            </div>
            {records.error ? (
              <ErrorState message={errorMessage(records.error)} onRetry={() => records.refetch()} />
            ) : records.isLoading ? (
              <ListSkeleton rows={2} />
            ) : (records.data?.items.length ?? 0) === 0 ? (
              <EmptyState icon={FileText} title="No records available" description="Documents shared by the patient or uploaded by you will appear here." />
            ) : (
              <div className="space-y-6">
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

        <aside className="space-y-8">
          {patient && <PatientCard patient={patient} linkToChart />}

          <section className="rounded-xl border bg-card p-5" aria-labelledby="history-title">
            <h2 id="history-title" className="mb-3 flex items-center gap-2 font-semibold">
              <History className="size-4" /> History with you
            </h2>
            {others.length === 0 ? (
              <p className="text-sm text-muted-foreground">This is the first visit with you.</p>
            ) : (
              <ul className="space-y-3">
                {others.map((h) => (
                  <li key={h.id}>
                    <Link href={`/doctor/appointments/${h.id}`} className="block rounded-lg p-2 -m-2 hover:bg-muted">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{formatDate(h.startsAt, h.clinic.timezone)}</span>
                        <StatusBadge status={h.status} />
                      </div>
                      {h.reason && <p className="mt-0.5 truncate text-xs text-muted-foreground">{h.reason}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
