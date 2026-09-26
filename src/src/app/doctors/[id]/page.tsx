import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft, CalendarPlus, MapPin } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { DoctorAvatar, experienceLabel } from '@/components/landing/doctor-card';
import { findPublic, type PublicDoctor } from '@/components/landing/public-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Params = Promise<{ id: string }>;

const getDoctor = cache(async (id: string) => {
  const res = await findPublic<{ doctor: PublicDoctor }>(`/public/doctors/${encodeURIComponent(id)}`);
  return res?.doctor ?? null;
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getDoctor(id).catch(() => null);
  if (!doctor) return { title: 'Doctor not found' };
  const desc = `${doctor.name}${doctor.specialization ? `, ${doctor.specialization}` : ''}. Book an appointment online with Unimeds.`;
  return { title: doctor.name, description: desc, openGraph: { title: doctor.name, description: desc } };
}

export default async function DoctorPage({ params }: { params: Params }) {
  const { id } = await params;
  const doctor = await getDoctor(id);
  if (!doctor) notFound();
  const exp = experienceLabel(doctor.yearsOfExperience);

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <Link href="/doctors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All doctors
        </Link>

        <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          <DoctorAvatar name={doctor.name} avatarUrl={doctor.avatarUrl} className="size-20" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{doctor.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {doctor.specialization && (
                <Link href={`/doctors?specialization=${encodeURIComponent(doctor.specialization)}`}>
                  <Badge variant="secondary">{doctor.specialization}</Badge>
                </Link>
              )}
              {exp && <span className="text-sm text-muted-foreground">{exp}</span>}
            </div>
          </div>
        </header>

        {doctor.bio && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">About</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{doctor.bio}</p>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Where to see {doctor.name}</h2>
          {doctor.clinics.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">This doctor isn&apos;t taking online bookings at any clinic right now.</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {doctor.clinics.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {(c.address || c.city) && (
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        {[c.address, c.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <Button asChild className="mt-auto w-full sm:w-auto sm:self-start">
                    <Link href={`/patient/book?doctorId=${doctor.id}&clinicId=${c.id}`}>
                      <CalendarPlus /> Book appointment
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">You&apos;ll be asked to sign in or create an account before confirming a time.</p>
        </section>
      </div>
    </SiteShell>
  );
}
