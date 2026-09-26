'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Download, ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { api, errorMessage, recordFileUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { RECORD_TYPES, type Paged, type RecordItem, type RecordType } from '@/lib/types';
import { formatBytes, formatDate, RECORD_TYPE_LABEL, ROLE_LABEL } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { clinicKeys, useUrlState } from '../_components/hooks';
import { IconCircle, Panel, PersonAvatar, PILL_TRIGGER } from '../_components/panel';
import { SearchInput } from '../_components/search-input';

const ALL = '__all';

function RecordsView() {
  const { params, set, page } = useUrlState();
  const q = params.get('q') ?? '';
  const typeParam = params.get('type') ?? '';
  const type = (RECORD_TYPES as readonly string[]).includes(typeParam) ? (typeParam as RecordType) : '';
  const filters = { q: q || undefined, type: type || undefined, page, pageSize: Number(params.get('size')) || 20 };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...clinicKeys.records, filters],
    queryFn: () => api.get<Paged<RecordItem>>('/clinic/records', filters),
  });

  return (
    <>
      <PageHeader title="Records" description="Documents shared with or created at your clinic. Patients' private uploads aren't visible here." />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput key={q} value={q} onSearch={(v) => set({ q: v })} placeholder="Search by title" label="Search records" />
        <Select value={type || ALL} onValueChange={(v) => set({ type: v === ALL ? null : v })}>
          <SelectTrigger className={cn(PILL_TRIGGER, 'w-full sm:w-52', type && 'bg-accent text-accent-foreground')} aria-label="Record type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {RECORD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {RECORD_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={FileText}
          title={q || type ? 'No records match' : 'No records yet'}
          description={q || type ? 'Try a different search or type.' : 'Records appear here when doctors upload them or patients attach them to a visit.'}
        />
      ) : (
        <>
          <Panel title="Documents" description={`${data.total} ${data.total === 1 ? 'record' : 'records'}`}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 pl-0 text-xs font-medium text-muted-foreground">Document</TableHead>
                  <TableHead className="hidden h-11 text-xs font-medium text-muted-foreground md:table-cell">Patient</TableHead>
                  <TableHead className="hidden h-11 text-xs font-medium text-muted-foreground lg:table-cell">Uploaded by</TableHead>
                  <TableHead className="hidden h-11 text-xs font-medium text-muted-foreground sm:table-cell">Date</TableHead>
                  <TableHead className="hidden h-11 text-right text-xs font-medium text-muted-foreground lg:table-cell">Size</TableHead>
                  <TableHead className="h-11 pr-0 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((r) => {
                  const label = r.title || r.fileName;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="py-3 pl-0">
                        <span className="flex items-center gap-3">
                          <IconCircle icon={r.mimeType?.startsWith('image/') ? ImageIcon : FileText} />
                          <span className="min-w-0">
                            <span className="block max-w-64 truncate font-semibold">{label}</span>
                            <span className="block text-xs text-muted-foreground">{RECORD_TYPE_LABEL[r.recordType] ?? r.recordType}</span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden py-3 md:table-cell">
                        {r.patient ? (
                          <Link href={`/clinic/patients/${r.patient.id}`} className="flex items-center gap-2.5 underline-offset-4 hover:underline">
                            <PersonAvatar name={r.patient.name} className="size-8 text-xs" />
                            <span className="max-w-40 truncate font-medium">{r.patient.name}</span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden py-3 lg:table-cell">
                        {r.uploadedBy ? (
                          <span className="block">
                            <span className="block max-w-40 truncate">{r.uploadedBy.name}</span>
                            <span className="block text-xs text-muted-foreground">{ROLE_LABEL[r.uploadedBy.role]}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden py-3 sm:table-cell">
                        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums">{formatDate(r.createdAt)}</span>
                      </TableCell>
                      <TableCell className="hidden py-3 text-right text-muted-foreground tabular-nums lg:table-cell">
                        {r.fileSize ? formatBytes(r.fileSize) : '—'}
                      </TableCell>
                      <TableCell className="py-3 pr-0">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="outline" size="icon-sm">
                            <a href={recordFileUrl(r.id)} target="_blank" rel="noopener" aria-label={`View ${label}`}>
                              <ExternalLink />
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="icon-sm">
                            <a href={recordFileUrl(r.id, true)} aria-label={`Download ${label}`}>
                              <Download />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Panel>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 20 ? null : n })} />
        </>
      )}
    </>
  );
}

export default function ClinicRecordsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <RecordsView />
    </Suspense>
  );
}
