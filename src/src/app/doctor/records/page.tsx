'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { RECORD_TYPE_LABEL } from '@/lib/format';
import { RECORD_TYPES, type Paged, type RecordItem, type RecordType } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecordsList, SearchInput } from '../_components/bits';
import { useUrlFilters } from '../_components/hooks';

function RecordsView() {
  const { params, set, page } = useUrlFilters();
  const q = params.get('q') ?? '';
  const typeParam = params.get('type');
  const type = typeParam && (RECORD_TYPES as readonly string[]).includes(typeParam) ? (typeParam as RecordType) : undefined;
  const filters = { q: q || undefined, type, page };

  const { data, isLoading, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['doctor', 'records', filters],
    queryFn: () => api.get<Paged<RecordItem>>('/doctor/records', filters),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader title="Records" description="Documents you uploaded, ones shared with your visits, and records of patients in your active care." />
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput initial={q} onSearch={(v) => set({ q: v })} placeholder="Search by title" label="Search records by title" />
        <Select value={type ?? 'all'} onValueChange={(v) => set({ type: v })}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {RECORD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {RECORD_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <>
          <div className={`transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
            <RecordsList records={data.items} showPatient />
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}

export default function DoctorRecordsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <RecordsView />
    </Suspense>
  );
}
