import Link from 'next/link';
import { ArrowUpRight, Building2, MapPin, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { distanceLabel } from '@/components/landing/doctor-card';
import type { PublicClinic } from '@/lib/types';

export function ClinicLogo({ name, logoUrl, className }: { name: string; logoUrl: string | null; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${name} logo`} className={cn('size-14 shrink-0 rounded-2xl bg-muted object-contain p-1', className)} />;
  }
  return (
    <div className={cn('flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground', className)} aria-hidden>
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
      className="group flex h-full flex-col gap-4 rounded-3xl bg-card p-5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div className="flex items-start gap-4">
        <ClinicLogo name={clinic.name} logoUrl={clinic.logoUrl} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{clinic.name}</h2>
          {address && (
            <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-2">{address}</span>
            </p>
          )}
        </div>
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      {clinic.description && <p className="line-clamp-2 text-sm text-muted-foreground">{clinic.description}</p>}
      {(clinic.doctorCount != null || dist) && (
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-medium">
          {clinic.doctorCount != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <Stethoscope className="size-3.5" />
              <span className="tabular-nums">{clinic.doctorCount}</span> doctor{clinic.doctorCount === 1 ? '' : 's'}
            </span>
          )}
          {dist && <span className="inline-flex items-center rounded-full bg-muted px-3 py-1.5">{dist}</span>}
        </div>
      )}
    </Link>
  );
}
