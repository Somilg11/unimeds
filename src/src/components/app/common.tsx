'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_LABEL } from '@/lib/format';
import type { AppointmentStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** "Upcoming appointments · See all" style section heading. */
export function SectionHeader({ title, href, linkLabel = 'See all', className }: { title: string; href?: string; linkLabel?: string; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline">
          {linkLabel} <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: 'bg-muted text-foreground',
  confirmed: 'bg-accent text-accent-foreground',
  reschedule_proposed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-muted text-muted-foreground line-through',
  completed: 'bg-muted text-muted-foreground',
  no_show: 'bg-destructive/10 text-destructive',
};

const SHORT_LABEL: Partial<Record<AppointmentStatus, string>> = { pending: 'Pending', reschedule_proposed: 'New time' };

/** `tone="inverted"` for use on the solid blue block; `compact` for tight rows. */
export function StatusBadge({
  status,
  className,
  tone,
  compact,
}: {
  status: AppointmentStatus;
  className?: string;
  tone?: 'inverted';
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        tone === 'inverted' ? 'bg-brand-foreground text-brand' : STATUS_STYLE[status],
        className
      )}
    >
      {(compact && SHORT_LABEL[status]) || STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-card px-6 py-12 text-center">
      {Icon && (
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
function pageList(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export const PAGE_SIZES = [10, 20, 30, 50, 100];

/**
 * Table / list footer: "Showing 21–40 of 57", numbered pages and an optional
 * rows-per-page picker. Always visible once there is data, so every table has
 * the same footer even when it fits on one page.
 */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
}) {
  if (!total && totalPages <= 1) return null;
  const from = pageSize && total ? (page - 1) * pageSize + 1 : null;
  const to = pageSize && total ? Math.min(page * pageSize, total) : null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-col-reverse items-center justify-between gap-4 text-sm sm:flex-row">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="tabular-nums">
          {from !== null ? (
            <>
              Showing <span className="font-medium text-foreground">{from}–{to}</span> of {total}
            </>
          ) : (
            <>
              Page {page} of {totalPages}
              {total !== undefined && ` · ${total} total`}
            </>
          )}
        </span>
        {onPageSize && pageSize && (
          <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
            <SelectTrigger size="sm" className="w-auto gap-1 rounded-full bg-card" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="bg-card" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        {pageList(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden>
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="icon"
              className="tabular-nums"
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              onClick={() => p !== page && onPage(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="outline" size="icon" className="bg-card" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}

/** Render-prop wrapper around `useClientPage`: pages a whole list and adds the footer. */
export function ClientPaged<T>({ items, pageSize = 10, children }: { items: T[]; pageSize?: number; children: (rows: T[]) => React.ReactNode }) {
  const { rows, pagination } = useClientPage(items, pageSize);
  return (
    <>
      {children(rows)}
      <Pagination {...pagination} />
    </>
  );
}

/** Client-side paging for small lists the API returns whole (e.g. clinic members). */
export function useClientPage<T>(items: T[] | undefined, initialSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const list = items ?? [];
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(page, totalPages);
  return {
    rows: list.slice((current - 1) * pageSize, current * pageSize),
    pagination: {
      page: current,
      totalPages,
      total: list.length,
      pageSize,
      onPage: setPage,
      onPageSize: (n: number) => {
        setPageSize(n);
        setPage(1);
      },
    },
  };
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-3xl" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-3xl bg-card px-6 py-10 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  /** Solid blue card for the one number that matters most */
  highlight?: boolean;
}) {
  return (
    <div className={cn('rounded-3xl p-5', highlight ? 'bg-brand text-brand-foreground' : 'bg-card')}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm', highlight ? 'text-brand-foreground/80' : 'text-muted-foreground')}>{label}</span>
        {Icon && (
          <span
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full',
              highlight ? 'bg-white/20 text-brand-foreground' : 'bg-accent text-accent-foreground'
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className={cn('mt-1 text-xs', highlight ? 'text-brand-foreground/80' : 'text-muted-foreground')}>{hint}</p>}
    </div>
  );
}
