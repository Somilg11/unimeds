import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft, CalendarClock, CalendarPlus, Clock, MapPin, Phone, Stethoscope, XCircle } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { ClinicLogo, clinicAddress } from '@/components/landing/clinic-card';
import { DoctorAvatar, experienceLabel } from '@/components/landing/doctor-card';
import { IconCircle } from '@/components/landing/section';
import { findPublic, type ClinicDoctor, type PublicClinicDetail } from '@/components/landing/public-data';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/json-ld';
import { absoluteUrl } from '@/lib/site';

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
  const path = `/clinics/${clinic.slug}`;
  return {
    title: clinic.name,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title: clinic.name, description: desc, url: path, ...(clinic.logoUrl ? { images: [clinic.logoUrl] } : {}) },
  };
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: clinic.name,
    url: absoluteUrl(`/clinics/${clinic.slug}`),
    ...(clinic.description ? { description: clinic.description } : {}),
    ...(clinic.logoUrl ? { logo: clinic.logoUrl, image: clinic.logoUrl } : {}),
    ...(clinic.phone ? { telephone: clinic.phone } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address ?? undefined,
      addressLocality: clinic.city ?? undefined,
      addressRegion: clinic.state ?? undefined,
      postalCode: clinic.zipCode ?? undefined,
    },
    ...(clinic.latitude != null && clinic.longitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: clinic.latitude, longitude: clinic.longitude } }
      : {}),
    medicalSpecialty: [...new Set(doctors.map((d) => d.specialization).filter(Boolean))],
    employee: doctors.map((d) => ({ '@type': 'Physician', name: d.name, url: absoluteUrl(`/doctors/${d.id}`) })),
  };

  return (
    <SiteShell>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <Link href="/clinics" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All clinics
        </Link>

        <header className="mt-4 rounded-[2rem] bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <ClinicLogo name={clinic.name} logoUrl={clinic.logoUrl} className="size-20" />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{clinic.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {address && (
                  <span className="inline-flex max-w-full items-start gap-1.5 rounded-3xl bg-muted px-3 py-1.5">
                    <MapPin className="mt-0.5 size-4 shrink-0" /> <span>{address}</span>
                  </span>
                )}
                {clinic.phone && (
                  <a
                    href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    <Phone className="size-4" /> {clinic.phone}
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                  <Stethoscope className="size-4" />
                  <span className="tabular-nums">{doctors.length}</span> doctor{doctors.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
          {clinic.description && (
            <p className="mt-6 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{clinic.description}</p>
          )}
        </header>

        <section className="mt-10" aria-labelledby="policy-h">
          <h2 id="policy-h" className="mb-3 text-lg font-semibold tracking-tight">
            Booking policy
          </h2>
          <dl className="grid gap-3 sm:grid-cols-3">
            {policy.map((p) => (
              <div key={p.label} className="rounded-3xl bg-card p-5">
                <IconCircle icon={p.icon} className="size-10" />
                <dt className="mt-4 text-sm text-muted-foreground">{p.label}</dt>
                <dd className="mt-1 text-sm font-semibold">{p.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">Times are shown in the clinic&apos;s local time zone ({clinic.timezone}).</p>
        </section>

        <section className="mt-10" aria-labelledby="doctors-h">
          <h2 id="doctors-h" className="mb-3 text-lg font-semibold tracking-tight">
            Doctors
          </h2>
          {doctors.length === 0 ? (
            <div className="rounded-3xl bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No doctors are taking online bookings here yet.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {doctors.map((d) => {
                const exp = experienceLabel(d.yearsOfExperience);
                return (
                  <li key={d.id} className="flex flex-col gap-4 rounded-3xl bg-card p-5">
                    <div className="flex items-start gap-4">
                      <DoctorAvatar name={d.name} avatarUrl={d.avatarUrl} />
                      <div className="min-w-0">
                        <Link href={`/doctors/${d.id}`} className="text-base font-semibold hover:underline">
                          {d.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{d.specialization || 'General practice'}</p>
                        {exp && <p className="mt-1 text-xs text-muted-foreground">{exp}</p>}
                      </div>
                    </div>
                    {d.bio && <p className="line-clamp-3 text-sm text-muted-foreground">{d.bio}</p>}
                    <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                      <Button asChild size="lg" className="h-11">
                        <Link href={`/patient/book?doctorId=${d.id}&clinicId=${clinic.id}`}>
                          <CalendarPlus /> Book appointment
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="h-11">
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
