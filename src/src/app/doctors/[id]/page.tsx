import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft, Building2, CalendarPlus, MapPin } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { DoctorAvatar } from '@/components/landing/doctor-card';
import { IconCircle } from '@/components/landing/section';
import { findPublic, type PublicDoctor } from '@/components/landing/public-data';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/json-ld';
import { absoluteUrl } from '@/lib/site';

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
  const path = `/doctors/${doctor.id}`;
  return {
    title: doctor.name,
    description: desc,
    alternates: { canonical: path },
    openGraph: { type: 'profile', title: doctor.name, description: desc, url: path, ...(doctor.avatarUrl ? { images: [doctor.avatarUrl] } : {}) },
  };
}

const bookHref = (doctorId: string, clinicId: string) => `/patient/book?doctorId=${doctorId}&clinicId=${clinicId}`;

export default async function DoctorPage({ params }: { params: Params }) {
  const { id } = await params;
  const doctor = await getDoctor(id);
  if (!doctor) notFound();

  const cities = new Set(doctor.clinics.map((c) => c.city).filter(Boolean));
  const stats = [
    doctor.yearsOfExperience != null && {
      label: doctor.yearsOfExperience === 1 ? 'Year of experience' : 'Years of experience',
      value: doctor.yearsOfExperience,
    },
    { label: doctor.clinics.length === 1 ? 'Clinic taking bookings' : 'Clinics taking bookings', value: doctor.clinics.length },
    cities.size > 0 && { label: cities.size === 1 ? 'City' : 'Cities', value: cities.size },
  ].filter((s): s is { label: string; value: number } => Boolean(s));

  const single = doctor.clinics.length === 1 ? doctor.clinics[0] : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.name,
    url: absoluteUrl(`/doctors/${doctor.id}`),
    ...(doctor.avatarUrl ? { image: doctor.avatarUrl } : {}),
    ...(doctor.specialization ? { medicalSpecialty: doctor.specialization } : {}),
    ...(doctor.bio ? { description: doctor.bio } : {}),
    address: doctor.clinics
      .filter((c) => c.address || c.city)
      .map((c) => ({ '@type': 'PostalAddress', streetAddress: c.address ?? undefined, addressLocality: c.city ?? undefined })),
    worksFor: doctor.clinics.map((c) => ({ '@type': 'MedicalClinic', name: c.name, ...(c.slug ? { url: absoluteUrl(`/clinics/${c.slug}`) } : {}) })),
  };

  return (
    <SiteShell>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <Link href="/doctors" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All doctors
        </Link>

        <header className="mt-4 rounded-[2rem] bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <DoctorAvatar name={doctor.name} avatarUrl={doctor.avatarUrl} className="size-24 sm:size-28" fallbackClassName="text-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{doctor.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                {doctor.specialization ? (
                  <Link
                    href={`/doctors?specialization=${encodeURIComponent(doctor.specialization)}`}
                    className="inline-flex items-center rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:underline"
                  >
                    {doctor.specialization}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">General practice</span>
                )}
              </div>
            </div>
            {doctor.clinics.length > 0 && (
              <Button asChild size="lg" className="hidden h-12 px-6 sm:inline-flex">
                <Link href={single ? bookHref(doctor.id, single.id) : '#clinics'}>
                  <CalendarPlus /> Book appointment
                </Link>
              </Button>
            )}
          </div>

          {stats.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-1 rounded-3xl bg-muted p-4">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="text-2xl font-bold tracking-tight tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        {doctor.bio && (
          <section aria-labelledby="about-h" className="mt-3 rounded-3xl bg-card p-6 sm:p-8">
            <h2 id="about-h" className="text-lg font-semibold tracking-tight">
              About
            </h2>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{doctor.bio}</p>
          </section>
        )}

        <section id="clinics" aria-labelledby="where-h" className="mt-10 scroll-mt-24">
          <h2 id="where-h" className="mb-3 text-lg font-semibold tracking-tight">
            Where to see {doctor.name}
          </h2>
          {doctor.clinics.length === 0 ? (
            <div className="rounded-3xl bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              This doctor isn&apos;t taking online bookings at any clinic right now.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {doctor.clinics.map((c) => (
                <li key={c.id} className="flex flex-col gap-5 rounded-3xl bg-card p-5">
                  <div className="flex items-start gap-3">
                    <IconCircle icon={Building2} />
                    <div className="min-w-0">
                      <p className="font-semibold">{c.name}</p>
                      {(c.address || c.city) && (
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 size-3.5 shrink-0" />
                          {[c.address, c.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button asChild size="lg" className="mt-auto h-11 w-full sm:w-auto sm:self-start">
                    <Link href={bookHref(doctor.id, c.id)}>
                      <CalendarPlus /> Book appointment
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">You&apos;ll be asked to sign in or create an account before confirming a time.</p>
        </section>

        {doctor.clinics.length > 0 && (
          <>
            {/* Mobile: sticky primary action */}
            <div className="h-20 sm:hidden" aria-hidden />
            <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:hidden">
              <Button asChild size="lg" className="h-12 w-full">
                <Link href={single ? bookHref(doctor.id, single.id) : '#clinics'}>
                  <CalendarPlus /> {single ? 'Book appointment' : 'Choose a clinic to book'}
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}
