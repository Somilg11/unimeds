'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Building2, ChevronRight } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Paged } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClinicStatusBadge, CLINIC_STATUS_LABEL, Identity, Panel, TABLE_HEAD_ROW } from '../_components/bits';
import { OnboardClinicDialog } from '../_components/onboard-clinic-dialog';
import { SearchInput, useUrlState } from '../_components/url-state';
import { CLINIC_STATUSES, PLAN_LABEL, type AdminClinicRow } from '../_components/types';

export default function ClinicsPage() {
  return (
    <>
      <PageHeader title="Clinics" description="Every tenant on the platform." actions={<OnboardClinicDialog />} />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <ClinicsList />
      </Suspense>
    </>
  );
}

function ClinicsList() {
  const router = useRouter();
  const { get, set, page } = useUrlState();
  const pageSize = Number(get('size')) || 20;
  const q = get('q');
  const status = get('status');

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['admin', 'clinics', { q, status, page, pageSize }],
    queryFn: () => api.get<Paged<AdminClinicRow>>('/admin/clinics', { q, status, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={status || 'all'} onValueChange={(v) => set({ status: v === 'all' ? null : v })}>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="h-10 bg-card" aria-label="Filter by status">
              <TabsTrigger value="all" className="px-4">
                All
              </TabsTrigger>
              {CLINIC_STATUSES.map((s) => (
                <TabsTrigger key={s} value={s} className="px-4">
                  {CLINIC_STATUS_LABEL[s]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <SearchInput label="Search clinics" placeholder="Name, email or city" value={q} onSearch={(v) => set({ q: v })} />
      </div>

      {isPending ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={q || status ? 'No clinics match these filters' : 'No clinics yet'}
          description={q || status ? 'Try a different search or status.' : 'Onboard your first clinic to get started.'}
        />
      ) : (
        <>
          <Panel flush title="All clinics" description={`${data.total} ${data.total === 1 ? 'clinic' : 'clinics'}`} className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEAD_ROW}>
                  <TableHead>Clinic</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Doctors</TableHead>
                  <TableHead className="text-right">Admins</TableHead>
                  <TableHead className="text-right">Bookings (30d)</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-8">
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((c) => (
                  <TableRow key={c.id} className="group cursor-pointer" onClick={() => router.push(`/admin/clinics/${c.id}`)}>
                    <TableCell className="py-3.5">
                      <Identity name={c.name} sub={c.email}>
                        <Link href={`/admin/clinics/${c.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {c.name}
                        </Link>
                      </Identity>
                    </TableCell>
                    <TableCell className={c.city ? undefined : 'text-muted-foreground'}>{c.city || '—'}</TableCell>
                    <TableCell>
                      <ClinicStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{PLAN_LABEL[c.plan] ?? c.plan}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{c.doctors}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{c.admins}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{c.appointments30d}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 20 ? null : n })} />
        </>
      )}
    </div>
  );
}
