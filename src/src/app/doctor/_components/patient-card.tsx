'use client';

import Link from 'next/link';
import { Droplet, Phone, TriangleAlert, UserRound } from 'lucide-react';
import { initials } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ageFrom, useNow, type ClinicalPatient } from './hooks';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

export function PatientCard({ patient, linkToChart }: { patient: ClinicalPatient; linkToChart?: boolean }) {
  const now = useNow(60 * 60_000);
  const age = ageFrom(patient.dateOfBirth, now);
  const ec = patient.emergencyContact;
  const hasEc = Boolean(ec && (ec.name || ec.phone));

  return (
    <section className="rounded-xl border bg-card p-5" aria-labelledby="patient-card-title">
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt="" />}
          <AvatarFallback>{initials(patient.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 id="patient-card-title" className="truncate font-semibold">
            {patient.name}
          </h2>
          <p className="truncate text-xs text-muted-foreground">{patient.email}</p>
        </div>
      </div>

      {patient.allergies ? (
        <div className="mt-4 flex gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200" role="note">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Allergies</p>
            <p>{patient.allergies}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">No known allergies recorded.</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <Field label="Age">{age !== null ? `${age} yrs` : null}</Field>
        <Field label="Gender">{patient.gender ? <span className="capitalize">{patient.gender}</span> : null}</Field>
        <Field label="Blood type">
          {patient.bloodType ? (
            <span className="inline-flex items-center gap-1">
              <Droplet className="size-3.5 text-rose-600" /> {patient.bloodType}
            </span>
          ) : null}
        </Field>
        <Field label="Phone">
          {patient.phone ? (
            <a href={`tel:${patient.phone}`} className="inline-flex items-center gap-1 hover:underline">
              <Phone className="size-3.5" /> {patient.phone}
            </a>
          ) : null}
        </Field>
      </dl>

      <div className="mt-4 border-t pt-4">
        <p className="text-xs text-muted-foreground">Emergency contact</p>
        {hasEc ? (
          <p className="mt-0.5 text-sm">
            {ec?.name}
            {ec?.relation && <span className="text-muted-foreground"> ({ec.relation})</span>}
            {ec?.phone && (
              <>
                {' · '}
                <a href={`tel:${ec.phone}`} className="hover:underline">
                  {ec.phone}
                </a>
              </>
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-muted-foreground">Not provided</p>
        )}
      </div>

      {linkToChart && (
        <Link href={`/doctor/patients/${patient.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <UserRound className="size-4" /> Open patient chart
        </Link>
      )}
    </section>
  );
}
