'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import type { Paged } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchInput } from '../_components/bits';
import { useUrlFilters, type DoctorPatientRow } from '../_components/hooks';

function PatientsView() {
  const { params, set, page } = useUrlFilters();
  const q = params.get('q') ?? '';
  const filters = { q: q || undefined, page };
  const { data, isLoading, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['doctor', 'patients', filters],
    queryFn: () => api.get<Paged<DoctorPatientRow>>('/doctor/patients', filters),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader title="Patients" description="Everyone who has booked a visit with you." />
      <div className="mb-6">
        <SearchInput initial={q} onSearch={(v) => set({ q: v })} placeholder="Name, email or phone" label="Search patients" />
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton rows={6} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Users} title={q ? 'No matching patients' : 'No patients yet'} description={q ? 'Try a different search.' : 'Patients appear once they book with you.'} />
      ) : (
        <>
          <ul className={`divide-y rounded-xl border bg-card transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
            {data.items.map((p) => (
              <li key={p.id}>
                <Link href={`/doctor/patients/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none">
                  <Avatar className="size-10">
                    {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" />}
                    <AvatarFallback>{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {p.email}
                      {p.phone && ` · ${p.phone}`}
                    </p>
                    <p className="text-xs text-muted-foreground md:hidden">
                      {p.visits} {p.visits === 1 ? 'visit' : 'visits'}
                      {p.nextVisit && ` · next ${formatDate(p.nextVisit)}`}
                    </p>
                  </div>
                  <dl className="hidden shrink-0 grid-cols-3 gap-6 text-sm md:grid">
                    <div>
                      <dt className="text-xs text-muted-foreground">Visits</dt>
                      <dd className="tabular-nums">{p.visits}</dd>
                    </div>
                    <div className="w-28">
                      <dt className="text-xs text-muted-foreground">Last visit</dt>
                      <dd>{p.lastVisit ? formatDate(p.lastVisit) : '—'}</dd>
                    </div>
                    <div className="w-28">
                      <dt className="text-xs text-muted-foreground">Next visit</dt>
                      <dd>{p.nextVisit ? formatDate(p.nextVisit) : '—'}</dd>
                    </div>
                  </dl>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}

export default function DoctorPatientsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <PatientsView />
    </Suspense>
  );
}
