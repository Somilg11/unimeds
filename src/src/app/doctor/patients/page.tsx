'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FileText, Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Paged } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, Pagination } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PersonAvatar, SearchInput } from '../_components/bits';
import { useUrlFilters, type DoctorPatientRow } from '../_components/hooks';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted px-3 py-2 leading-tight">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function PatientsView() {
  const { params, set, page } = useUrlFilters();
  const q = params.get('q') ?? '';
  const pageSize = Number(params.get('size')) || 20;
  const filters = { q: q || undefined, page, pageSize };
  const { data, isLoading, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['doctor', 'patients', filters],
    queryFn: () => api.get<Paged<DoctorPatientRow>>('/doctor/patients', filters),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Patients</h1>
          <p className="text-sm text-muted-foreground">Everyone who has booked a visit with you.</p>
        </div>
        <Button variant="outline" asChild className="shrink-0">
          <Link href="/doctor/records">
            <FileText /> Records
          </Link>
        </Button>
      </div>

      <SearchInput initial={q} onSearch={(v) => set({ q: v })} placeholder="Name, email or phone" label="Search patients" />

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton rows={6} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Users} title={q ? 'No matching patients' : 'No patients yet'} description={q ? 'Try a different search.' : 'Patients appear once they book with you.'} />
      ) : (
        <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
          {/* Desktop: table */}
          <div className="hidden rounded-3xl bg-card p-2 lg:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">Patient</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">Contact</TableHead>
                  <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">Visits</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">Last visit</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">Next visit</TableHead>
                  <TableHead className="h-10 w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((p) => (
                  <TableRow key={p.id} className="relative cursor-pointer">
                    <TableCell className="py-3">
                      {/* Stretched link makes the whole row clickable while staying one tab stop */}
                      <Link href={`/doctor/patients/${p.id}`} className="flex items-center gap-3 outline-none after:absolute after:inset-0 focus-visible:underline">
                        <PersonAvatar name={p.name} src={p.avatarUrl} />
                        <span className="max-w-56 truncate font-semibold">{p.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="block max-w-64 truncate">{p.email}</span>
                      {p.phone && <span className="block text-xs">{p.phone}</span>}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{p.visits}</TableCell>
                    <TableCell className="text-muted-foreground">{p.lastVisit ? formatDate(p.lastVisit) : '—'}</TableCell>
                    <TableCell>
                      {p.nextVisit ? (
                        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{formatDate(p.nextVisit)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:hidden">
            {data.items.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/doctor/patients/${p.id}`}
                  className="block h-full rounded-3xl bg-card p-4 transition-colors hover:bg-card/70 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={p.name} src={p.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{p.phone ?? p.email}</p>
                    </div>
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2">
                    <Stat label="Visits" value={String(p.visits)} />
                    <Stat label="Last" value={p.lastVisit ? formatDate(p.lastVisit) : '—'} />
                    <Stat label="Next" value={p.nextVisit ? formatDate(p.nextVisit) : '—'} />
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 20 ? null : n })} />
        </div>
      )}
    </div>
  );
}

export default function DoctorPatientsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <PatientsView />
    </Suspense>
  );
}
