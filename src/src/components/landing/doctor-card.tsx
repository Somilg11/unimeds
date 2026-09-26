import Link from 'next/link';
import { ArrowUpRight, Briefcase, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/format';
import type { PublicDoctor } from '@/lib/types';

export function DoctorAvatar({
  name,
  avatarUrl,
  className,
  fallbackClassName,
}: {
  name: string;
  avatarUrl: string | null;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={cn('size-14', className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback className={cn('bg-accent font-semibold text-accent-foreground', fallbackClassName)}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

export const experienceLabel = (years: number | null) =>
  years == null ? null : `${years} year${years === 1 ? '' : 's'} of experience`;

export const distanceLabel = (km: number | null | undefined) =>
  km == null ? null : km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

export function DoctorCard({ doctor }: { doctor: PublicDoctor }) {
  return (
    <Link
      href={`/doctors/${doctor.id}`}
      className="group flex h-full flex-col gap-5 rounded-3xl bg-card p-5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div className="flex items-start gap-4">
        <DoctorAvatar name={doctor.name} avatarUrl={doctor.avatarUrl} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{doctor.name}</h2>
          <p className="truncate text-sm text-muted-foreground">{doctor.specialization || 'General practice'}</p>
        </div>
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      {doctor.yearsOfExperience != null && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
            <Briefcase className="size-3.5" />
            <span className="tabular-nums">{doctor.yearsOfExperience}</span> yr{doctor.yearsOfExperience === 1 ? '' : 's'} experience
          </span>
        </div>
      )}

      {doctor.clinics.length > 0 && (
        <ul className="mt-auto space-y-2 border-t pt-4 text-sm">
          {doctor.clinics.slice(0, 2).map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">
                <span className="font-medium text-foreground">{c.name}</span>
                {c.city && `, ${c.city}`}
                {distanceLabel(c.distanceKm) && <span className="text-xs"> · {distanceLabel(c.distanceKm)}</span>}
              </span>
            </li>
          ))}
          {doctor.clinics.length > 2 && (
            <li className="pl-6 text-xs text-muted-foreground">
              +{doctor.clinics.length - 2} more clinic{doctor.clinics.length - 2 === 1 ? '' : 's'}
            </li>
          )}
        </ul>
      )}
    </Link>
  );
}
