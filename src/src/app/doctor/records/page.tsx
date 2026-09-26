'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { RECORD_TYPE_LABEL } from '@/lib/format';
import { RECORD_TYPES, type Paged, type RecordItem, type RecordType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, Pagination } from '@/components/app/common';
import { FilterPill, RecordsList, SearchInput } from '../_components/bits';
import { useUrlFilters } from '../_components/hooks';

function RecordsView() {
  const { params, set, page } = useUrlFilters();
  const q = params.get('q') ?? '';
  const typeParam = params.get('type');
  const type = typeParam && (RECORD_TYPES as readonly string[]).includes(typeParam) ? (typeParam as RecordType) : undefined;
  const pageSize = Number(params.get('size')) || 20;
  const filters = { q: q || undefined, type, page, pageSize };

  const { data, isLoading, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['doctor', 'records', filters],
    queryFn: () => api.get<Paged<RecordItem>>('/doctor/records', filters),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Records</h1>
        <p className="text-sm text-muted-foreground">Documents you uploaded, ones shared with your visits, and records of patients in your active care.</p>
      </div>

      <div className="space-y-3">
        <SearchInput initial={q} onSearch={(v) => set({ q: v })} placeholder="Search by title" label="Search records by title" />
        <div role="group" aria-label="Filter by type" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          <FilterPill active={!type} onClick={() => set({ type: null })}>
            All types
          </FilterPill>
          {RECORD_TYPES.map((t) => (
            <FilterPill key={t} active={type === t} onClick={() => set({ type: t })}>
              {RECORD_TYPE_LABEL[t]}
            </FilterPill>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton rows={6} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={q || type ? 'No matching records' : 'No records yet'}
          description={q || type ? 'Try clearing the filters.' : 'Upload documents from a patient chart or appointment.'}
        />
      ) : (
        <div>
          <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
            <RecordsList records={data.items} showPatient />
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 20 ? null : n })} />
        </div>
      )}
    </div>
  );
}

export default function DoctorRecordsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <RecordsView />
    </Suspense>
  );
}
