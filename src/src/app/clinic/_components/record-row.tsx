'use client';

import Link from 'next/link';
import { Download, ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { recordFileUrl } from '@/lib/api';
import type { RecordItem } from '@/lib/types';
import { formatBytes, formatDate, RECORD_TYPE_LABEL, ROLE_LABEL } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { IconCircle } from './panel';

/** One clinic record with view (new tab) and download links. */
export function RecordRow({ record: r, showPatient = true }: { record: RecordItem; showPatient?: boolean }) {
  const Icon = r.mimeType?.startsWith('image/') ? ImageIcon : FileText;
  return (
    <li className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      <IconCircle icon={Icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{r.title || r.fileName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {RECORD_TYPE_LABEL[r.recordType] ?? r.recordType}
          {showPatient && r.patient && (
            <>
              {' · '}
              <Link href={`/clinic/patients/${r.patient.id}`} className="underline-offset-4 hover:text-foreground hover:underline">
                {r.patient.name}
              </Link>
            </>
          )}
          {' · '}
          {formatDate(r.createdAt)}
          {r.uploadedBy && ` · by ${r.uploadedBy.name} (${ROLE_LABEL[r.uploadedBy.role]})`}
          {r.fileSize ? ` · ${formatBytes(r.fileSize)}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button asChild variant="ghost" size="icon-sm">
          <a href={recordFileUrl(r.id)} target="_blank" rel="noopener" aria-label={`View ${r.title || r.fileName}`}>
            <ExternalLink />
          </a>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <a href={recordFileUrl(r.id, true)} aria-label={`Download ${r.title || r.fileName}`}>
            <Download />
          </a>
        </Button>
      </div>
    </li>
  );
}
