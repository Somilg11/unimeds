'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, UserRound } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { clinicKeys, useClinic, useUrlState } from '../_components/hooks';
import { SearchInput } from '../_components/search-input';
import { Panel, PersonAvatar } from '../_components/panel';
import type { ClinicPatientRow } from '../_components/types';

function PatientsView() {
  const { params, set, page } = useUrlState();
  const { data: clinic } = useClinic();
  const tz = clinic?.timezone;
  const q = params.get('q') ?? '';
  const filters = { q: q || undefined, page, pageSize: Number(params.get('size')) || 20 };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...clinicKeys.patients, filters],
    queryFn: () => api.get<Paged<ClinicPatientRow>>('/clinic/patients', filters),
  });

  return (
    <>
      <PageHeader title="Patients" description="Everyone who has booked at your clinic." />
      <div className="mb-6">
        <SearchInput key={q} value={q} onSearch={(v) => set({ q: v })} placeholder="Name, email or phone" label="Search patients" />
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <EmptyState icon={UserRound} title={q ? 'No patients match' : 'No patients yet'} description={q ? 'Try a different search.' : undefined} />
      ) : (
        <>
          <Panel title="All patients" description={`${data.total} ${data.total === 1 ? 'patient' : 'patients'}`}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 pl-0 text-xs font-medium text-muted-foreground">Patient</TableHead>
                  <TableHead className="hidden h-11 text-xs font-medium text-muted-foreground md:table-cell">Phone</TableHead>
                  <TableHead className="h-11 text-right text-xs font-medium text-muted-foreground">Visits</TableHead>
                  <TableHead className="hidden h-11 text-xs font-medium text-muted-foreground sm:table-cell">Last visit</TableHead>
                  <TableHead className="hidden h-11 text-xs font-medium text-muted-foreground sm:table-cell">Next visit</TableHead>
                  <TableHead className="h-11 w-8 pr-0">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((p) => (
                  <TableRow key={p.id} className="relative">
                    <TableCell className="py-3 pl-0">
                      <Link
                        href={`/clinic/patients/${p.id}`}
                        className="flex items-center gap-3 outline-none after:absolute after:inset-0 focus-visible:after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/40"
                      >
                        <PersonAvatar name={p.name} src={p.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{p.phone || '—'}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex min-w-8 justify-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums">{p.visits}</span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{p.lastVisit ? formatDate(p.lastVisit, tz) : '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {p.nextVisit ? (
                        <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground tabular-nums">
                          {formatDate(p.nextVisit, tz)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-0">
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 20 ? null : n })} />
        </>
      )}
    </>
  );
}

export default function ClinicPatientsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <PatientsView />
    </Suspense>
  );
}
