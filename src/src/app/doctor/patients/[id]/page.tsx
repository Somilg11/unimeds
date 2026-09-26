'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarX, ChevronRight, FileText } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { Appointment, RecordItem } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, StatusBadge } from '@/components/app/common';
import { RecordUploadDialog } from '@/components/app/record-upload-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RecordsList, ZoneHint } from '../../_components/bits';
import type { ClinicalPatient } from '../../_components/hooks';
import { PatientCard } from '../../_components/patient-card';

type Chart = { patient: ClinicalPatient; appointments: Appointment[]; records: RecordItem[] };

export default function DoctorPatientChartPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor', 'patient', id],
    queryFn: () => api.get<Chart>(`/doctor/patients/${id}`),
  });

  const back = (
    <Link href="/doctor/patients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Patients
    </Link>
  );

  if (error)
    return (
      <>
        {back}
        <ErrorState
          message={error instanceof ApiError && error.status === 403 ? "This patient isn't under your care at any of your clinics." : errorMessage(error)}
          onRetry={error instanceof ApiError && error.status === 403 ? undefined : () => refetch()}
        />
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

  const { patient, appointments, records } = data;
  const attachable = appointments
    .filter((a) => a.status !== 'cancelled')
    .map((a) => ({ id: a.id, label: `${formatDate(a.startsAt, a.clinic.timezone)} · ${a.clinic.name}` }));

  return (
    <>
      {back}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">
            {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'} with you · {records.length}{' '}
            {records.length === 1 ? 'record' : 'records'}
          </p>
        </div>
        <RecordUploadDialog
          base="/doctor"
          patientId={patient.id}
          appointments={attachable}
          onUploaded={() => {
            void qc.invalidateQueries({ queryKey: ['doctor', 'patient', id] });
            void qc.invalidateQueries({ queryKey: ['doctor', 'records'] });
          }}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <aside className="lg:order-2">
          <PatientCard patient={patient} />
        </aside>

        <div className="space-y-8 lg:order-1 lg:col-span-2">
          <section aria-labelledby="visits-title">
            <h2 id="visits-title" className="mb-4 text-lg font-semibold">
              Appointments
            </h2>
            {appointments.length === 0 ? (
              <EmptyState icon={CalendarX} title="No appointments" />
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {appointments.map((a) => (
                  <li key={a.id}>
                    <Link href={`/doctor/appointments/${a.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none">
                      <div className="w-28 shrink-0 text-sm">
                        <p className="font-medium">{formatDate(a.startsAt, a.clinic.timezone)}</p>
                        <p className="text-muted-foreground tabular-nums">
                          {formatTime(a.startsAt, a.clinic.timezone)}
                          <ZoneHint timezone={a.clinic.timezone} />
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{a.reason || <span className="text-muted-foreground">No reason given</span>}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.clinic.name}</p>
                        {a.clinicalNotes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Notes: {a.clinicalNotes}</p>}
                      </div>
                      <StatusBadge status={a.status} />
                      <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="records-title">
            <h2 id="records-title" className="mb-4 text-lg font-semibold">
              Records
            </h2>
            {records.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No records available"
                description="You'll see documents the patient shares with your visits, ones you upload, and their records while they're in your active care."
              />
            ) : (
              <RecordsList records={records} />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
