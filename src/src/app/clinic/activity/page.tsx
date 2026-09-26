'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { formatDateTime, initials, relativeTime, ROLE_LABEL } from '@/lib/format';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { clinicKeys, useClinic, useUrlState } from '../_components/hooks';
import { humanizeAction } from '../_components/utils';
import type { AuditEntry } from '../_components/types';

function ActivityView() {
  const { set, page } = useUrlState();
  const { data: clinic } = useClinic();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...clinicKeys.audit, page],
    queryFn: () => api.get<Paged<AuditEntry>>('/clinic/audit-logs', { page, pageSize: 30 }),
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
          <ol className="divide-y rounded-xl border bg-card">
            {data.items.map((e) => (
              <li key={e.id} className="flex items-start gap-4 p-4">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs">{initials(e.actor?.name ?? 'System')}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{e.actor?.name ?? 'System'}</span>{' '}
                    {e.actor && <span className="text-xs text-muted-foreground">({ROLE_LABEL[e.actor.role] ?? e.actor.role})</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {humanizeAction(e.action)}
                    {e.targetType === 'appointment' && e.targetId && (
                      <>
                        {' · '}
                        <Link href={`/clinic/appointments?scope=all&focus=${e.targetId}`} className="underline-offset-4 hover:text-foreground hover:underline">
                          View
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <time dateTime={e.createdAt} title={formatDateTime(e.createdAt, clinic?.timezone)} className="shrink-0 text-xs text-muted-foreground">
                  {relativeTime(e.createdAt)}
                </time>
              </li>
            ))}
          </ol>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: p })} />
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
