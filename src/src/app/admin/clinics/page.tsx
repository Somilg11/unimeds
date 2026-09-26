'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Paged } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClinicStatusBadge, CLINIC_STATUS_LABEL } from '../_components/bits';
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
  const q = get('q');
  const status = get('status');

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['admin', 'clinics', { q, status, page }],
    queryFn: () => api.get<Paged<AdminClinicRow>>('/admin/clinics', { q, status, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput label="Search clinics" placeholder="Name, email or city" value={q} onSearch={(v) => set({ q: v })} />
        <Select value={status || 'all'} onValueChange={(v) => set({ status: v === 'all' ? null : v })}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CLINIC_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {CLINIC_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Doctors</TableHead>
                  <TableHead className="text-right">Admins</TableHead>
                  <TableHead className="text-right">Bookings (30d)</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/admin/clinics/${c.id}`)}>
                    <TableCell>
                      <Link href={`/admin/clinics/${c.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </TableCell>
                    <TableCell>{c.city || '—'}</TableCell>
                    <TableCell>
                      <ClinicStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>{PLAN_LABEL[c.plan] ?? c.plan}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.doctors}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.admins}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.appointments30d}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => set({ page: p })} />
        </>
      )}
    </div>
  );
}
