'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, FileText, Search, type LucideIcon } from 'lucide-react';
import { recordFileUrl } from '@/lib/api';
import { formatBytes, formatDate, initials, isBrowserZone, RECORD_TYPE_LABEL, zoneLabel } from '@/lib/format';
import type { RecordItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Tabs as a white pill track with a solid black active pill, in both themes. */
export const PILL_TABS_LIST = 'bg-card group-data-horizontal/tabs:h-12';
export const PILL_TAB =
  'px-5 data-active:bg-secondary data-active:text-secondary-foreground dark:data-active:border-transparent dark:data-active:bg-secondary dark:data-active:text-secondary-foreground';

/** Pill search box that reports its value after the user pauses typing. */
export function SearchInput({
  initial,
  onSearch,
  placeholder,
  label,
  delay = 350,
  className,
}: {
  initial: string;
  onSearch: (q: string) => void;
  placeholder: string;
  label: string;
  delay?: number;
  className?: string;
}) {
  const [text, setText] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div role="search" className={cn('relative w-full lg:max-w-xs', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        aria-label={label}
        placeholder={placeholder}
        className="h-12 rounded-full border-0 bg-card pl-12 text-base shadow-none md:text-sm"
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onSearch(v.trim()), delay);
        }}
      />
    </div>
  );
}

/** Zone suffix such as " IST", shown only when the clinic zone differs from the viewer's. */
export function ZoneHint({ timezone, className }: { timezone: string; className?: string }) {
  if (isBrowserZone(timezone)) return null;
  return <span className={className ?? 'text-xs text-muted-foreground'}> {zoneLabel(timezone)}</span>;
}

/** Patient avatar with the initials fallback used across the portal. */
export function PersonAvatar({
  name,
  src,
  className,
  inverted,
}: {
  name: string;
  src?: string | null;
  className?: string;
  /** White fallback for use on the solid blue block */
  inverted?: boolean;
}) {
  return (
    <Avatar className={cn('size-12', className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className={cn('font-semibold', inverted ? 'bg-white text-brand' : 'bg-accent text-accent-foreground')}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Icon in a circle: blue tint by default, grey when `muted`. */
export function IconCircle({ icon: Icon, muted, className }: { icon: LucideIcon; muted?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
        muted ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground',
        className
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

/** Small label/value tile with an icon circle. */
export function InfoTile({ icon, label, children, className }: { icon: LucideIcon; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col items-start gap-2.5 rounded-3xl bg-card p-4 sm:flex-row sm:items-center sm:gap-3', className)}>
      <IconCircle icon={icon} muted />
      <div className="min-w-0 leading-tight">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-semibold break-words">{children}</div>
      </div>
    </div>
  );
}

/** Rounded pill used for filters; `active` fills it black. */
export function FilterPill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none',
        active ? 'bg-secondary text-secondary-foreground' : 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {children}
    </button>
  );
}

/** Round back button + label for detail pages. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-card text-foreground">
        <ArrowLeft className="size-4" />
      </span>
      {label}
    </Link>
  );
}

/** Document cards: file icon, title, meta, then View / Download pills. */
export function RecordsList({ records, showPatient }: { records: RecordItem[]; showPatient?: boolean }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {records.map((r) => (
        <li key={r.id} className="flex flex-col gap-4 rounded-3xl bg-card p-4">
          <div className="flex min-w-0 items-start gap-3">
            <IconCircle icon={FileText} className="size-11" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-semibold">{r.title}</p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">{RECORD_TYPE_LABEL[r.recordType] ?? r.recordType}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground tabular-nums">{formatDate(r.createdAt)}</span>
                {r.fileSize != null && <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground tabular-nums">{formatBytes(r.fileSize)}</span>}
              </div>
              {r.uploadedBy && <p className="text-xs text-muted-foreground">Uploaded by {r.uploadedBy.name}</p>}
            </div>
          </div>

          {(showPatient && r.patient) || r.appointmentId ? (
            <div className="space-y-2 border-t pt-3 text-sm">
              {showPatient && r.patient && (
                <Link href={`/doctor/patients/${r.patient.id}`} className="flex items-center gap-2 font-medium hover:underline">
                  <PersonAvatar name={r.patient.name} className="size-7 text-xs" />
                  <span className="truncate">{r.patient.name}</span>
                </Link>
              )}
              {r.appointmentId && (
                <p className="text-xs text-muted-foreground">
                  Linked to{' '}
                  <Link href={`/doctor/appointments/${r.appointmentId}`} className="font-medium text-primary hover:underline">
                    an appointment
                  </Link>
                  {r.clinic && ` at ${r.clinic.name}`}
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-auto grid grid-cols-2 gap-2">
            <Button variant="outline" asChild className="h-11">
              <a href={recordFileUrl(r.id)} target="_blank" rel="noopener" aria-label={`View ${r.title}`}>
                <ExternalLink /> View
              </a>
            </Button>
            <Button variant="outline" asChild className="h-11">
              <a href={recordFileUrl(r.id, true)} aria-label={`Download ${r.title}`}>
                <Download /> Download
              </a>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
