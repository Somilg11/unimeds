'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarPlus, CalendarX2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { Appointment, Paged } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, Pagination } from '@/components/app/common';
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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Appointments</h1>
          <p className="text-sm text-muted-foreground">Times are shown in each clinic&apos;s local time.</p>
        </div>
        <Button asChild size="icon-lg" className="size-12 shrink-0 lg:hidden" aria-label="Book a visit">
          <Link href="/patient/book">
            <CalendarPlus className="size-5" />
          </Link>
        </Button>
        <Button asChild size="lg" className="hidden h-12 lg:inline-flex">
          <Link href="/patient/book">
            <CalendarPlus /> Book a visit
          </Link>
        </Button>
      </div>

      <Tabs value={scope} onValueChange={(v) => setParams({ tab: v as Scope, page: 1 })} className="mb-5">
        <TabsList className="h-13 w-full rounded-full bg-card p-1 lg:w-80">
          {(['upcoming', 'past'] as const).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="h-full rounded-full text-sm data-active:bg-secondary data-active:text-secondary-foreground dark:data-active:bg-secondary dark:data-active:text-secondary-foreground"
            >
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
              {scope === t && data && !isPlaceholderData ? <span className="tabular-nums opacity-70">{data.total}</span> : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={CalendarX2}
          title={scope === 'upcoming' ? 'No upcoming visits' : 'No past visits'}
          description={scope === 'upcoming' ? 'When you book a visit it will show up here.' : 'Completed and cancelled visits will appear here.'}
          action={
            scope === 'upcoming' ? (
              <Button asChild size="lg">
                <Link href="/patient/book">Find a doctor</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className={cn('grid gap-3 lg:grid-cols-2', isPlaceholderData && 'opacity-60')}>
            {data.items.map((a) => (
              <li key={a.id}>
                <AppointmentRow appointment={a} />
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => setParams({ page: p })} />
        </>
      )}
    </>
  );
}
