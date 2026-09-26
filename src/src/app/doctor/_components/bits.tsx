'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, FileText, Search } from 'lucide-react';
import { recordFileUrl } from '@/lib/api';
import { formatBytes, formatDate, isBrowserZone, RECORD_TYPE_LABEL, zoneLabel } from '@/lib/format';
import type { RecordItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Search box that reports its value after the user pauses typing. */
export function SearchInput({
  initial,
  onSearch,
  placeholder,
  label,
  delay = 350,
}: {
  initial: string;
  onSearch: (q: string) => void;
  placeholder: string;
  label: string;
  delay?: number;
}) {
  const [text, setText] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        aria-label={label}
        placeholder={placeholder}
        className="pl-9"
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

export function RecordsList({ records, showPatient }: { records: RecordItem[]; showPatient?: boolean }) {
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {records.map((r) => (
        <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {RECORD_TYPE_LABEL[r.recordType] ?? r.recordType} · {formatDate(r.createdAt)} · {formatBytes(r.fileSize)}
                {r.uploadedBy && ` · by ${r.uploadedBy.name}`}
              </p>
              {showPatient && r.patient && (
                <p className="text-xs">
                  Patient:{' '}
                  <Link href={`/doctor/patients/${r.patient.id}`} className="font-medium text-primary hover:underline">
                    {r.patient.name}
                  </Link>
                </p>
              )}
              {r.appointmentId && (
                <p className="text-xs text-muted-foreground">
                  Linked to{' '}
                  <Link href={`/doctor/appointments/${r.appointmentId}`} className="hover:underline">
                    an appointment
                  </Link>
                  {r.clinic && ` at ${r.clinic.name}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={recordFileUrl(r.id)} target="_blank" rel="noopener" aria-label={`View ${r.title}`}>
                <ExternalLink /> View
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
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
