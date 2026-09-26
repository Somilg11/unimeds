import Link from 'next/link';
import { Building2, MapPin, Stethoscope } from 'lucide-react';
import { distanceLabel } from '@/components/landing/doctor-card';
import type { PublicClinic } from '@/lib/types';

export function ClinicLogo({ name, logoUrl, className = 'size-12' }: { name: string; logoUrl: string | null; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${name} logo`} className={`${className} shrink-0 rounded-lg border object-contain`} />;
  }
  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary`} aria-hidden>
      <Building2 className="size-5" />
    </div>
  );
}

export const clinicAddress = (c: Pick<PublicClinic, 'address' | 'city' | 'state' | 'zipCode'>) =>
  [c.address, c.city, c.state, c.zipCode].filter(Boolean).join(', ');

export function ClinicCard({ clinic }: { clinic: PublicClinic }) {
  const address = clinicAddress(clinic);
  const dist = distanceLabel(clinic.distanceKm);
  return (
    <Link
      href={`/clinics/${clinic.slug}`}
      className="group flex h-full flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-4">
        <ClinicLogo name={clinic.name} logoUrl={clinic.logoUrl} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold group-hover:text-primary">{clinic.name}</h2>
          {address && (
            <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span>{address}</span>
            </p>
          )}
        </div>
      </div>
      {clinic.description && <p className="line-clamp-2 text-sm text-muted-foreground">{clinic.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        {clinic.doctorCount != null && (
          <span className="flex items-center gap-1.5">
            <Stethoscope className="size-3.5" />
            {clinic.doctorCount} doctor{clinic.doctorCount === 1 ? '' : 's'}
          </span>
        )}
        {dist && <span>{dist}</span>}
      </div>
    </Link>
  );
}
