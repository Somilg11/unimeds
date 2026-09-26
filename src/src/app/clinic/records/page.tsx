'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { RECORD_TYPES, type Paged, type RecordItem, type RecordType } from '@/lib/types';
import { RECORD_TYPE_LABEL } from '@/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { clinicKeys, useUrlState } from '../_components/hooks';
import { RecordRow } from '../_components/record-row';
import { SearchInput } from '../_components/search-input';

const ALL = '__all';

function RecordsView() {
  const { params, set, page } = useUrlState();
  const q = params.get('q') ?? '';
  const typeParam = params.get('type') ?? '';
  const type = (RECORD_TYPES as readonly string[]).includes(typeParam) ? (typeParam as RecordType) : '';
  const filters = { q: q || undefined, type: type || undefined, page, pageSize: 20 };

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
          <SelectTrigger className="w-full sm:w-52" aria-label="Record type">
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
          <ul className="divide-y rounded-xl border bg-card">
            {data.items.map((r) => (
              <RecordRow key={r.id} record={r} />
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: p })} />
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
