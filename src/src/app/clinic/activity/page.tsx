'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bot, ChevronRight, History } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { formatDateTime, relativeTime, ROLE_LABEL } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { clinicKeys, useClinic, useUrlState } from '../_components/hooks';
import { humanizeAction } from '../_components/utils';
import { IconCircle, Panel, PersonAvatar } from '../_components/panel';
import type { AuditEntry } from '../_components/types';

function ActivityView() {
  const { params, set, page } = useUrlState();
  const pageSize = Number(params.get('size')) || 30;
  const { data: clinic } = useClinic();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...clinicKeys.audit, page, pageSize],
    queryFn: () => api.get<Paged<AuditEntry>>('/clinic/audit-logs', { page, pageSize }),
  });

  return (
    <>
      <PageHeader title="Activity" description="A read-only log of actions taken at your clinic." />
      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <EmptyState icon={History} title="No activity yet" />
      ) : (
        <>
          <Panel title="Recent activity" description={`${data.total} ${data.total === 1 ? 'event' : 'events'}`}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 pl-0 text-xs font-medium text-muted-foreground">Who</TableHead>
                  <TableHead className="h-11 text-xs font-medium text-muted-foreground">Action</TableHead>
                  <TableHead className="h-11 pr-0 text-right text-xs font-medium text-muted-foreground">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="py-3 pl-0">
                      <span className="flex items-center gap-3">
                        {e.actor ? <PersonAvatar name={e.actor.name} className="size-9 text-xs" /> : <IconCircle icon={Bot} tone="muted" className="size-9" />}
                        <span className="min-w-0">
                          <span className="block max-w-48 truncate font-semibold">{e.actor?.name ?? 'System'}</span>
                          {e.actor && <span className="block text-xs text-muted-foreground">{ROLE_LABEL[e.actor.role] ?? e.actor.role}</span>}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="flex flex-wrap items-center gap-2">
                        <span>{humanizeAction(e.action)}</span>
                        {e.targetType === 'appointment' && e.targetId && (
                          <Link
                            href={`/clinic/appointments?scope=all&focus=${e.targetId}`}
                            className="inline-flex items-center gap-0.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground hover:underline"
                          >
                            View <ChevronRight className="size-3" aria-hidden />
                          </Link>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 pr-0 text-right">
                      <time dateTime={e.createdAt} title={formatDateTime(e.createdAt, clinic?.timezone)} className="text-xs whitespace-nowrap text-muted-foreground">
                        {relativeTime(e.createdAt)}
                      </time>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 30 ? null : n })} />
        </>
      )}
    </>
  );
}

export default function ClinicActivityPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={8} />}>
      <ActivityView />
    </Suspense>
  );
}
