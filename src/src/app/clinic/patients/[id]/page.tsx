'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, FileText } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/app/common';
import { AppointmentRow } from '../../_components/appointment-row';
import { AppointmentSheet } from '../../_components/appointment-sheet';
import { RecordRow } from '../../_components/record-row';
import { CountChip, Panel, PersonAvatar } from '../../_components/panel';
import type { ClinicPatientDetail } from '../../_components/types';

export default function ClinicPatientPage() {
  const { id } = useParams<{ id: string }>();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clinic', 'patient', id],
    queryFn: () => api.get<ClinicPatientDetail>(`/clinic/patients/${id}`),
  });

  const back = (
    <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
      <Link href="/clinic/patients">
        <ArrowLeft /> Patients
      </Link>
    </Button>
  );

  if (isLoading)
    return (
      <>
        {back}
        <ListSkeleton rows={5} />
      </>
    );
  if (error || !data)
    return (
      <>
        {back}
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      </>
    );

  const p = data.patient;
  const upcoming = data.appointments.filter((a) => ['pending', 'confirmed', 'reschedule_proposed'].includes(a.status) && new Date(a.endsAt) > new Date());
  const completed = data.appointments.filter((a) => a.status === 'completed').length;

  return (
    <>
      {back}
      <div className="mb-6 flex flex-col gap-5 rounded-3xl bg-card p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <PersonAvatar name={p?.name} src={p?.avatarUrl} className="size-16 text-xl" />
          <div className="min-w-0 space-y-0.5">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{p?.name ?? 'Patient'}</h1>
            <p className="truncate text-sm text-muted-foreground">{p?.email}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Phone', p?.phone || '—'],
            ['Date of birth', p?.dateOfBirth ? formatDate(`${p.dateOfBirth}T12:00:00Z`, 'UTC') : '—'],
            ['Gender', p?.gender || '—'],
            ['Completed visits', String(completed)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-32 rounded-2xl bg-muted/60 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="truncate text-sm font-semibold capitalize tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          id="appts-heading"
          title={
            <>
              Appointments at this clinic
              <CountChip>{data.appointments.length}</CountChip>
            </>
          }
          description={upcoming.length > 0 ? `${upcoming.length} upcoming` : undefined}
        >
          {data.appointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointments" />
          ) : (
            <ul className="divide-y">
              {data.appointments.map((a) => (
                <AppointmentRow key={a.id} appointment={a} onOpen={setOpenId} actions={false} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="records-heading"
          title={
            <>
              Clinic records
              <CountChip>{data.records.length}</CountChip>
            </>
          }
        >
          {data.records.length === 0 ? (
            <EmptyState icon={FileText} title="No records" description="Only documents shared with this clinic appear here." />
          ) : (
            <ul className="divide-y">
              {data.records.map((r) => (
                <RecordRow key={r.id} record={r} showPatient={false} />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <AppointmentSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
