'use client';

import { Fragment, Suspense, useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronRight, Cpu, Download, ScrollText, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime, ROLE_LABEL } from '@/lib/format';
import type { Paged } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FILTER_CONTROL, IconCircle, Identity, Panel, TABLE_HEAD_ROW } from '../_components/bits';
import { useUrlState } from '../_components/url-state';
import { humanizeAction, type AuditEntry } from '../_components/types';

type AuditResponse = Paged<AuditEntry> & { actions: string[] };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Local-midnight of a YYYY-MM-DD date (plus `addDays`) as an ISO instant. */
function dayStartIso(day: string, addDays = 0) {
  if (!DATE_RE.test(day)) return undefined;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d! + addDays).toISOString();
}

export default function AuditPage() {
  return (
    <>
      <PageHeader title="Audit log" description="Read-only record of sign-ins, changes and data access across the platform." />
      <Suspense fallback={<ListSkeleton rows={8} />}>
        <AuditLog />
      </Suspense>
    </>
  );
}

function AuditLog() {
  const { get, set, page } = useUrlState();
  const pageSize = Number(get('size')) || 50;
  const action = get('action');
  const clinicId = get('clinicId');
  const from = get('from');
  const to = get('to');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['admin', 'audit', { action, clinicId, from, to, page, pageSize }],
    queryFn: () =>
      api.get<AuditResponse>('/admin/audit-logs', {
        action,
        clinicId,
        // Dates are the viewer's local days; "to" is inclusive
        from: from ? dayStartIso(from) : undefined,
        to: to ? dayStartIso(to, 1) : undefined,
        page,
        pageSize,
      }),
    placeholderData: keepPreviousData,
  });

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clinicName = data?.items.find((e) => e.clinic?.id === clinicId)?.clinic?.name;
  const filtered = Boolean(action || clinicId || from || to);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="audit-action" className="px-1 text-xs text-muted-foreground">
            Action
          </Label>
          <Select value={action || 'all'} onValueChange={(v) => set({ action: v === 'all' ? null : v })}>
            <SelectTrigger id="audit-action" className={`${FILTER_CONTROL} w-full px-4 md:w-64`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All actions</SelectItem>
              {(data?.actions ?? (action ? [action] : [])).map((a) => (
                <SelectItem key={a} value={a}>
                  {humanizeAction(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="audit-from" className="px-1 text-xs text-muted-foreground">
              From
            </Label>
            <Input id="audit-from" type="date" value={from} max={to || undefined} onChange={(e) => set({ from: e.target.value })} className={`${FILTER_CONTROL} px-4 md:w-44`} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-to" className="px-1 text-xs text-muted-foreground">
              To
            </Label>
            <Input id="audit-to" type="date" value={to} min={from || undefined} onChange={(e) => set({ to: e.target.value })} className={`${FILTER_CONTROL} px-4 md:w-44`} />
          </div>
        </div>
        {clinicId && (
          <div className="space-y-1.5">
            <span className="block px-1 text-xs text-muted-foreground">Clinic</span>
            <span className="inline-flex h-10 items-center gap-1 rounded-full bg-accent pr-1 pl-4 text-sm font-medium text-accent-foreground">
              <Link href={`/admin/clinics/${clinicId}`} className="max-w-48 truncate hover:underline">
                {clinicName ?? `${clinicId.slice(0, 8)}…`}
              </Link>
              <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-card" aria-label="Remove clinic filter" onClick={() => set({ clinicId: null })}>
                <X className="size-3.5" />
              </Button>
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 md:ml-auto">
          {filtered && (
            <Button variant="ghost" size="lg" onClick={() => set({ action: null, clinicId: null, from: null, to: null })}>
              Clear filters
            </Button>
          )}
          <Button variant="secondary" size="lg" disabled={!data?.items.length} onClick={() => data && exportCsv(data.items, page)}>
            <Download /> Export page (CSV)
          </Button>
        </div>
      </div>

      {isPending ? (
        <ListSkeleton rows={8} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit entries" description={filtered ? 'Nothing matches these filters.' : undefined} />
      ) : (
        <>
          <Panel
            flush
            title="Events"
            description={`${data.total.toLocaleString('en-IN')} ${data.total === 1 ? 'entry' : 'entries'} · read-only`}
            className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}
          >
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEAD_ROW}>
                  <TableHead className="w-10">
                    <span className="sr-only">Details</span>
                  </TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((e) => {
                  const open = expanded.has(e.id);
                  const hasMeta = e.metadata && Object.keys(e.metadata).length > 0;
                  return (
                    <Fragment key={e.id}>
                      <TableRow className={open ? 'border-b-0 bg-muted/50' : undefined}>
                        <TableCell>
                          {hasMeta && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-full bg-muted"
                              aria-expanded={open}
                              aria-controls={`meta-${e.id}`}
                              aria-label={open ? 'Hide details' : 'Show details'}
                              onClick={() => toggle(e.id)}
                            >
                              <ChevronRight className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">{formatDateTime(e.createdAt, undefined, { timeStyle: 'medium' })}</TableCell>
                        <TableCell className="py-3">
                          {e.actor ? (
                            <Identity name={e.actor.name} sub={`${e.actor.email} · ${ROLE_LABEL[e.actor.role]}`} size="size-8" />
                          ) : (
                            <div className="flex items-center gap-3">
                              <IconCircle icon={Cpu} tone="muted" className="size-8" />
                              <span className="font-semibold text-muted-foreground">System</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="rounded-full bg-muted px-2.5 py-1 text-left text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                            onClick={() => set({ action: e.action })}
                            title={`Filter by ${e.action}`}
                          >
                            {humanizeAction(e.action)}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Target entry={e} />
                        </TableCell>
                        <TableCell>
                          {e.clinic ? (
                            <Link href={`/admin/clinics/${e.clinic.id}`} className="font-medium hover:underline">
                              {e.clinic.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{e.ipAddress ?? '—'}</TableCell>
                      </TableRow>
                      {open && hasMeta && (
                        <TableRow id={`meta-${e.id}`} className="bg-muted/50 hover:bg-muted/50">
                          <TableCell />
                          <TableCell colSpan={6} className="pt-0 pb-4">
                            <pre className="max-h-72 overflow-auto rounded-2xl bg-card p-4 font-mono text-xs whitespace-pre-wrap">{JSON.stringify(e.metadata, null, 2)}</pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Panel>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 50 ? null : n })} />
        </>
      )}
    </div>
  );
}

function Target({ entry }: { entry: AuditEntry }) {
  if (!entry.targetType) return <span className="text-muted-foreground">—</span>;
  const short = entry.targetId ? `${entry.targetId.slice(0, 8)}…` : '';
  const label = entry.targetType.replace(/_/g, ' ');
  if (entry.targetType === 'clinic' && entry.targetId) {
    return (
      <Link href={`/admin/clinics/${entry.targetId}`} className="hover:underline" title={entry.targetId}>
        <span className="capitalize">{label}</span> <span className="font-mono text-xs text-muted-foreground">{short}</span>
      </Link>
    );
  }
  return (
    <span title={entry.targetId ?? undefined}>
      <span className="capitalize">{label}</span> <span className="font-mono text-xs text-muted-foreground">{short}</span>
    </span>
  );
}

function csvCell(v: unknown) {
  let s = v === null || v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v);
  // Neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(items: AuditEntry[], page: number) {
  const header = ['time', 'actor_name', 'actor_email', 'actor_role', 'action', 'target_type', 'target_id', 'clinic_id', 'clinic_name', 'ip_address', 'metadata'];
  const rows = items.map((e) => [
    e.createdAt,
    e.actor?.name,
    e.actor?.email,
    e.actor?.role,
    e.action,
    e.targetType,
    e.targetId,
    e.clinic?.id,
    e.clinic?.name,
    e.ipAddress,
    e.metadata && Object.keys(e.metadata).length ? e.metadata : '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `unimeds-audit-${new Date().toISOString().slice(0, 10)}-p${page}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
