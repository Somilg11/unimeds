'use client';

import Link from 'next/link';
import { ChevronRight, Droplet, Phone, ShieldAlert, TriangleAlert, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonAvatar } from './bits';
import { ageFrom, useNow, type ClinicalPatient } from './hooks';

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">{children}</span>;
}

/** Patient header card: identity, vitals chips, allergies, contact and emergency contact. */
export function PatientCard({ patient, linkToChart, headingLevel = 2 }: { patient: ClinicalPatient; linkToChart?: boolean; headingLevel?: 1 | 2 }) {
  const now = useNow(60 * 60_000);
  const age = ageFrom(patient.dateOfBirth, now);
  const ec = patient.emergencyContact;
  const hasEc = Boolean(ec && (ec.name || ec.phone));
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <section className="rounded-3xl bg-card p-5" aria-labelledby="patient-card-title">
      <div className="flex items-center gap-3">
        <PersonAvatar name={patient.name} src={patient.avatarUrl} className="size-14" />
        <div className="min-w-0 flex-1">
          <Heading id="patient-card-title" className={headingLevel === 1 ? 'truncate text-2xl font-bold tracking-tight' : 'truncate text-lg font-semibold'}>
            {patient.name}
          </Heading>
          <p className="truncate text-sm text-muted-foreground">{patient.email}</p>
        </div>
        {patient.phone && (
          <Button variant="outline" size="icon-lg" asChild className="size-11">
            <a href={`tel:${patient.phone}`} aria-label={`Call ${patient.name}`}>
              <Phone />
            </a>
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip>{age !== null ? `${age} yrs` : 'Age —'}</Chip>
        <Chip>{patient.gender ? <span className="capitalize">{patient.gender}</span> : 'Gender —'}</Chip>
        <Chip>
          <Droplet className="size-3.5 text-primary" /> {patient.bloodType ?? '—'}
        </Chip>
        {patient.allergies ? (
          <span role="note" className="inline-flex max-w-full items-start gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            <span className="min-w-0 break-words">Allergies: {patient.allergies}</span>
          </span>
        ) : (
          <Chip>
            <span className="text-muted-foreground">No known allergies</span>
          </Chip>
        )}
      </div>

      <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Phone className="size-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-xs text-muted-foreground">Phone</p>
            {patient.phone ? (
              <a href={`tel:${patient.phone}`} className="text-sm font-medium hover:underline">
                {patient.phone}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Not provided</p>
            )}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShieldAlert className="size-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-xs text-muted-foreground">Emergency contact</p>
            {hasEc ? (
              <p className="truncate text-sm font-medium">
                {ec?.name}
                {ec?.relation && <span className="font-normal text-muted-foreground"> ({ec.relation})</span>}
                {ec?.phone && (
                  <>
                    {ec?.name ? ' · ' : ''}
                    <a href={`tel:${ec.phone}`} className="hover:underline">
                      {ec.phone}
                    </a>
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Not provided</p>
            )}
          </div>
        </div>
      </div>

      {linkToChart && (
        <Link
          href={`/doctor/patients/${patient.id}`}
          className="mt-4 flex h-11 items-center gap-2 rounded-full bg-muted px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <UserRound className="size-4" />
          <span className="flex-1">Open patient chart</span>
          <ChevronRight className="size-4" />
        </Link>
      )}
    </section>
  );
}
