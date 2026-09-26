'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CalendarX, Clock, FileText, Upload } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { Appointment, RecordItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, StatusBadge } from '@/components/app/common';
import { RecordUploadDialog } from '@/components/app/record-upload-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackLink, PILL_TAB, PILL_TABS_LIST, RecordsList, ZoneHint } from '../../_components/bits';
import type { ClinicalPatient } from '../../_components/hooks';
import { PatientCard } from '../../_components/patient-card';

type Chart = { patient: ClinicalPatient; appointments: Appointment[]; records: RecordItem[] };

function VisitCard({ appt: a }: { appt: Appointment }) {
  const tz = a.clinic.timezone;
  return (
    <Link
      href={`/doctor/appointments/${a.id}`}
      className="block rounded-3xl bg-card p-4 transition-colors hover:bg-card/70 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold">{a.reason || <span className="font-normal text-muted-foreground">No reason given</span>}</p>
          <p className="truncate text-sm text-muted-foreground">{a.clinic.name}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
          <CalendarDays className="size-4 text-muted-foreground" /> {formatDate(a.startsAt, tz)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 tabular-nums">
          <Clock className="size-4 text-muted-foreground" /> {formatTime(a.startsAt, tz)}
          <ZoneHint timezone={tz} />
        </span>
      </div>
      {a.clinicalNotes && (
        <p className="mt-3 line-clamp-2 border-t pt-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes: </span>
          {a.clinicalNotes}
        </p>
      )}
    </Link>
  );
}

export default function DoctorPatientChartPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor', 'patient', id],
    queryFn: () => api.get<Chart>(`/doctor/patients/${id}`),
  });

  const back = <BackLink href="/doctor/patients" label="Patients" />;

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
        <Skeleton className="mb-6 h-48 rounded-3xl" />
        <ListSkeleton rows={4} />
      </>
    );

  const { patient, appointments, records } = data;
  const attachable = appointments
    .filter((a) => a.status !== 'cancelled')
    .map((a) => ({ id: a.id, label: `${formatDate(a.startsAt, a.clinic.timezone)} · ${a.clinic.name}` }));

  const upload = (
    <RecordUploadDialog
      base="/doctor"
      patientId={patient.id}
      appointments={attachable}
      onUploaded={() => {
        void qc.invalidateQueries({ queryKey: ['doctor', 'patient', id] });
        void qc.invalidateQueries({ queryKey: ['doctor', 'records'] });
      }}
      trigger={
        <Button size="lg" className="h-12 w-full lg:h-10 lg:w-auto">
          <Upload /> Upload document
        </Button>
      }
    />
  );

  return (
    <>
      {back}
      <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:order-2">
          <PatientCard patient={patient} headingLevel={1} />
          <p className="px-1 text-sm text-muted-foreground">
            {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'} with you · {records.length}{' '}
            {records.length === 1 ? 'record' : 'records'}
          </p>
          {upload}
        </aside>

        <div className="lg:order-1 lg:col-span-2">
          <Tabs defaultValue="visits" className="gap-4">
            <TabsList aria-label="Patient chart" className={cn(PILL_TABS_LIST, 'w-full lg:w-fit')}>
              <TabsTrigger value="visits" className={PILL_TAB}>
                Visits <span className="tabular-nums opacity-70">{appointments.length}</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className={PILL_TAB}>
                Documents <span className="tabular-nums opacity-70">{records.length}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visits">
              {appointments.length === 0 ? (
                <EmptyState icon={CalendarX} title="No appointments" />
              ) : (
                <ul className="space-y-3">
                  {appointments.map((a) => (
                    <li key={a.id}>
                      <VisitCard appt={a} />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="documents">
              {records.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No records available"
                  description="You'll see documents the patient shares with your visits, ones you upload, and their records while they're in your active care."
                />
              ) : (
                <RecordsList records={records} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
