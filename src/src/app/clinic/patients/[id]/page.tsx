'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, FileText } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/app/common';
import { AppointmentRow } from '../../_components/appointment-row';
import { AppointmentSheet } from '../../_components/appointment-sheet';
import { RecordRow } from '../../_components/record-row';
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
      <div className="mb-8 flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
        <Avatar className="size-14">
          {p?.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" />}
          <AvatarFallback className="text-lg">{initials(p?.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{p?.name ?? 'Patient'}</h1>
          <p className="text-sm text-muted-foreground">{p?.email}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd>{p?.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Date of birth</dt>
            <dd>{p?.dateOfBirth ? formatDate(`${p.dateOfBirth}T12:00:00Z`, 'UTC') : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Gender</dt>
            <dd className="capitalize">{p?.gender || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Completed visits</dt>
            <dd>{completed}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-10 xl:grid-cols-[3fr_2fr]">
        <section aria-labelledby="appts-heading" className="space-y-4">
          <h2 id="appts-heading" className="text-lg font-semibold">
            Appointments at this clinic <span className="text-sm font-normal text-muted-foreground">({data.appointments.length})</span>
          </h2>
          {upcoming.length > 0 && <p className="text-sm text-muted-foreground">{upcoming.length} upcoming</p>}
          {data.appointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointments" />
          ) : (
            <ul className="space-y-3">
              {data.appointments.map((a) => (
                <AppointmentRow key={a.id} appointment={a} onOpen={setOpenId} actions={false} />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="records-heading" className="space-y-4">
          <h2 id="records-heading" className="text-lg font-semibold">
            Clinic records <span className="text-sm font-normal text-muted-foreground">({data.records.length})</span>
          </h2>
          {data.records.length === 0 ? (
            <EmptyState icon={FileText} title="No records" description="Only documents shared with this clinic appear here." />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {data.records.map((r) => (
                <RecordRow key={r.id} record={r} showPatient={false} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <AppointmentSheet id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
