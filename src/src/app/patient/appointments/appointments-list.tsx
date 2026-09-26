'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarPlus, CalendarX2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Appointment, Paged } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentRow, PK } from '../_components/shared';

type Scope = 'upcoming' | 'past';
const PAGE_SIZE = 10;

export function AppointmentsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scope: Scope = searchParams.get('tab') === 'past' ? 'past' : 'upcoming';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const setParams = (next: { tab?: Scope; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    const tab = next.tab ?? scope;
    if (tab === 'past') params.set('tab', 'past');
    else params.delete('tab');
    const p = next.page ?? 1;
    if (p > 1) params.set('page', String(p));
    else params.delete('page');
    const s = params.toString();
    router.replace(`${pathname}${s ? `?${s}` : ''}`, { scroll: false });
  };

  const query = { scope, page, pageSize: PAGE_SIZE };
  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: PK.appointments(query),
    queryFn: () => api.get<Paged<Appointment>>('/patient/appointments', query),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Your visits, with times shown in each clinic's local time."
        actions={
          <Button asChild>
            <Link href="/patient/book">
              <CalendarPlus /> Book a visit
            </Link>
          </Button>
        }
      />

      <Tabs value={scope} onValueChange={(v) => setParams({ tab: v as Scope, page: 1 })} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={CalendarX2}
          title={scope === 'upcoming' ? 'No upcoming visits' : 'No past visits'}
          description={scope === 'upcoming' ? 'When you book a visit it will show up here.' : 'Completed and cancelled visits will appear here.'}
          action={
            scope === 'upcoming' ? (
              <Button asChild>
                <Link href="/patient/book">Find care</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className={cn('space-y-3', isPlaceholderData && 'opacity-60')}>
            {data.items.map((a) => (
              <li key={a.id}>
                <AppointmentRow appointment={a} />
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => setParams({ page: p })} />
        </>
      )}
    </>
  );
}
