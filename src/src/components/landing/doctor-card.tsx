import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/format';
import type { PublicDoctor } from '@/lib/types';

export function DoctorAvatar({ name, avatarUrl, className }: { name: string; avatarUrl: string | null; className?: string }) {
  return (
    <Avatar className={className ?? 'size-14'}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

export const experienceLabel = (years: number | null) =>
  years == null ? null : `${years} year${years === 1 ? '' : 's'} of experience`;

export const distanceLabel = (km: number | null | undefined) =>
  km == null ? null : km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

export function DoctorCard({ doctor }: { doctor: PublicDoctor }) {
  const exp = experienceLabel(doctor.yearsOfExperience);
  return (
    <Link
      href={`/doctors/${doctor.id}`}
      className="group flex h-full flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-4">
        <DoctorAvatar name={doctor.name} avatarUrl={doctor.avatarUrl} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold group-hover:text-primary">{doctor.name}</h2>
          <p className="text-sm text-muted-foreground">{doctor.specialization || 'General practice'}</p>
          {exp && <p className="mt-1 text-xs text-muted-foreground">{exp}</p>}
        </div>
      </div>
      {doctor.clinics.length > 0 && (
        <ul className="mt-auto space-y-1.5 border-t pt-3 text-sm">
          {doctor.clinics.slice(0, 3).map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="min-w-0">
                <span className="text-foreground">{c.name}</span>
                {c.city && `, ${c.city}`}
                {distanceLabel(c.distanceKm) && <span className="text-xs"> · {distanceLabel(c.distanceKm)}</span>}
              </span>
            </li>
          ))}
          {doctor.clinics.length > 3 && <li className="text-xs text-muted-foreground">+{doctor.clinics.length - 3} more</li>}
        </ul>
      )}
    </Link>
  );
}
