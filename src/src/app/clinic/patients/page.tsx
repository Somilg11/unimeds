'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, UserRound } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { formatDate, initials } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { clinicKeys, useClinic, useUrlState } from '../_components/hooks';
import { SearchInput } from '../_components/search-input';
import type { ClinicPatientRow } from '../_components/types';

function PatientsView() {
  const { params, set, page } = useUrlState();
  const { data: clinic } = useClinic();
  const tz = clinic?.timezone;
  const q = params.get('q') ?? '';
  const filters = { q: q || undefined, page, pageSize: 20 };

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
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="hidden sm:table-cell">Last visit</TableHead>
                  <TableHead className="hidden sm:table-cell">Next visit</TableHead>
                  <TableHead className="w-8">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((p) => (
                  <TableRow key={p.id} className="relative">
                    <TableCell>
                      <Link href={`/clinic/patients/${p.id}`} className="flex items-center gap-3 after:absolute after:inset-0">
                        <Avatar className="size-8">
                          {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" />}
                          <AvatarFallback>{initials(p.name)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.phone || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.visits}</TableCell>
                    <TableCell className="hidden sm:table-cell">{p.lastVisit ? formatDate(p.lastVisit, tz) : '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell">{p.nextVisit ? formatDate(p.nextVisit, tz) : '—'}</TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: p })} />
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
