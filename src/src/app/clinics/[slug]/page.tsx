import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft, CalendarClock, CalendarPlus, Clock, MapPin, Phone, XCircle } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { ClinicLogo, clinicAddress } from '@/components/landing/clinic-card';
import { DoctorAvatar, experienceLabel } from '@/components/landing/doctor-card';
import { findPublic, type ClinicDoctor, type PublicClinicDetail } from '@/components/landing/public-data';
import { Button } from '@/components/ui/button';

type Params = Promise<{ slug: string }>;

const getClinic = cache((slug: string) =>
  findPublic<{ clinic: PublicClinicDetail; doctors: ClinicDoctor[] }>(`/public/clinics/${encodeURIComponent(slug)}`)
);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getClinic(slug).catch(() => null);
  if (!data) return { title: 'Clinic not found' };
  const { clinic } = data;
  const desc = clinic.description || `Book an appointment at ${clinic.name}${clinic.city ? `, ${clinic.city}` : ''} with Unimeds.`;
  return { title: clinic.name, description: desc, openGraph: { title: clinic.name, description: desc } };
}

export default async function ClinicPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getClinic(slug);
  if (!data) notFound();
  const { clinic, doctors } = data;
  const address = clinicAddress(clinic);

  const policy = [
    { icon: Clock, label: 'Appointment length', value: `${clinic.slotDurationMinutes} minutes` },
    { icon: CalendarClock, label: 'Book ahead', value: `Up to ${clinic.bookingWindowDays} days in advance` },
    {
      icon: XCircle,
      label: 'Cancellation',
      value:
        clinic.cancellationHours > 0
          ? `Cancel online up to ${clinic.cancellationHours} hour${clinic.cancellationHours === 1 ? '' : 's'} before a confirmed visit`
          : 'Cancel any time before your visit',
    },
  ];

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <Link href="/clinics" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All clinics
        </Link>

        <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <ClinicLogo name={clinic.name} logoUrl={clinic.logoUrl} className="size-16" />
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">{clinic.name}</h1>
            <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
              {address && (
                <span className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 size-4 shrink-0" /> {address}
                </span>
              )}
              {clinic.phone && (
                <a href={`tel:${clinic.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <Phone className="size-4" /> {clinic.phone}
                </a>
              )}
            </div>
          </div>
        </header>

        {clinic.description && <p className="mt-6 max-w-3xl whitespace-pre-line text-muted-foreground">{clinic.description}</p>}

        <section className="mt-10" aria-labelledby="policy-h">
          <h2 id="policy-h" className="text-lg font-semibold">
            Booking policy
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {policy.map((p) => (
              <div key={p.label} className="rounded-xl border bg-card p-4">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <p.icon className="size-4" /> {p.label}
                </dt>
                <dd className="mt-1 text-sm font-medium">{p.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">Times are shown in the clinic&apos;s local time zone ({clinic.timezone}).</p>
        </section>

        <section className="mt-10" aria-labelledby="doctors-h">
          <h2 id="doctors-h" className="text-lg font-semibold">
            Doctors
          </h2>
          {doctors.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No doctors are taking online bookings here yet.</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {doctors.map((d) => {
                const exp = experienceLabel(d.yearsOfExperience);
                return (
                  <li key={d.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
                    <div className="flex items-start gap-4">
                      <DoctorAvatar name={d.name} avatarUrl={d.avatarUrl} />
                      <div className="min-w-0">
                        <Link href={`/doctors/${d.id}`} className="font-semibold hover:text-primary">
                          {d.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{d.specialization || 'General practice'}</p>
                        {exp && <p className="mt-1 text-xs text-muted-foreground">{exp}</p>}
                      </div>
                    </div>
                    {d.bio && <p className="line-clamp-3 text-sm text-muted-foreground">{d.bio}</p>}
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href={`/patient/book?doctorId=${d.id}&clinicId=${clinic.id}`}>
                          <CalendarPlus /> Book appointment
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/doctors/${d.id}`}>View profile</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
