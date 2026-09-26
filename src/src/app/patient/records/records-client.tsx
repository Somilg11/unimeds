'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Download, ExternalLink, FileImage, FileText, Loader2, Lock, Pencil, Search, Trash2 } from 'lucide-react';
import { api, errorMessage, recordFileUrl } from '@/lib/api';
import { formatBytes, formatDate, RECORD_TYPE_LABEL } from '@/lib/format';
import { RECORD_TYPES, type Paged, type RecordItem, type RecordType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { ConfirmAction } from '@/components/app/confirm-action';
import { RecordUploadDialog } from '@/components/app/record-upload-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PK, useShareableAppointments } from '../_components/shared';

const PAGE_SIZE = 12;
type ShareOption = { id: string; label: string };

function isRecordType(v: string | null): v is RecordType {
  return !!v && (RECORD_TYPES as readonly string[]).includes(v);
}

function EditForm({ record, shareable, onClose }: { record: RecordItem; shareable: ShareOption[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(record.title);
  const [recordType, setRecordType] = useState<RecordType>(record.recordType);
  const [share, setShare] = useState(record.appointmentId ?? 'private');
  const ownUpload = !record.uploadedBy || record.uploadedBy.role === 'patient';

  // Keep the current attachment selectable even if it's outside the recent list
  const options =
    record.appointmentId && !shareable.some((o) => o.id === record.appointmentId)
      ? [{ id: record.appointmentId, label: `Current appointment${record.clinic ? ` · ${record.clinic.name}` : ''}` }, ...shareable]
      : shareable;

  const save = useMutation({
    mutationFn: () => {
      const body: { title?: string; recordType?: RecordType; appointmentId?: string | null } = {};
      if (title.trim() && title.trim() !== record.title) body.title = title.trim();
      if (recordType !== record.recordType) body.recordType = recordType;
      const nextAppt = share === 'private' ? null : share;
      if (nextAppt !== record.appointmentId) body.appointmentId = nextAppt;
      return api.patch<{ record: RecordItem }>(`/patient/records/${record.id}`, body);
    },
    onSuccess: () => {
      toast.success('Document updated');
      void qc.invalidateQueries({ queryKey: PK.all });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-type">Type</Label>
        <Select value={recordType} onValueChange={(v) => setRecordType(v as RecordType)}>
          <SelectTrigger id="edit-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECORD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {RECORD_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-share">Sharing</Label>
        <Select value={share} onValueChange={setShare} disabled={!ownUpload}>
          <SelectTrigger id="edit-share" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private — only you</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {ownUpload
            ? 'Sharing with an appointment lets that clinic and doctor see this document.'
            : 'This document was added by your care team and stays shared with their clinic.'}
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending || !title.trim()}>
          {save.isPending && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

function RecordCard({ record: r, onEdit }: { record: RecordItem; onEdit: () => void }) {
  const qc = useQueryClient();
  const isImage = r.mimeType?.startsWith('image/');
  const Icon = isImage ? FileImage : FileText;
  const uploader = !r.uploadedBy ? null : r.uploadedBy.role === 'patient' ? 'You' : r.uploadedBy.name;

  const remove = async () => {
    try {
      await api.delete(`/patient/records/${r.id}`);
      toast.success('Document deleted');
      void qc.invalidateQueries({ queryKey: PK.all });
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium" title={r.title}>
            {r.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {RECORD_TYPE_LABEL[r.recordType]} · {formatBytes(r.fileSize)}
          </p>
        </div>
      </div>

      <dl className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {r.clinic ? <Building2 className="size-3.5" /> : <Lock className="size-3.5" />}
          <dt className="sr-only">Sharing</dt>
          <dd className="truncate">{r.clinic ? `Shared with ${r.clinic.name}` : 'Private'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="sr-only">Added</dt>
          <dd>
            {formatDate(r.createdAt)}
            {uploader && ` · by ${uploader}`}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href={recordFileUrl(r.id)} target="_blank" rel="noopener">
            <ExternalLink /> View
          </a>
        </Button>
        <Button variant="outline" size="icon-sm" asChild>
          <a href={recordFileUrl(r.id, true)} aria-label={`Download ${r.title}`}>
            <Download />
          </a>
        </Button>
        <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label={`Edit ${r.title}`}>
          <Pencil />
        </Button>
        <ConfirmAction
          trigger={
            <Button variant="destructive" size="icon-sm" aria-label={`Delete ${r.title}`}>
              <Trash2 />
            </Button>
          }
          title="Delete this document?"
          description={`“${r.title}” will be permanently deleted${r.clinic ? ` and no longer visible to ${r.clinic.name}` : ''}. This can’t be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={remove}
        />
      </div>
    </li>
  );
}

export function RecordsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const typeParam = searchParams.get('type');
  const type: RecordType | undefined = isRecordType(typeParam) ? typeParam : undefined;
  const q = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const shareable = useShareableAppointments();

  // Reads the live URL so a delayed (debounced) update never overwrites newer filters
  const setParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    if (!('page' in patch)) params.delete('page');
    const s = params.toString();
    router.replace(`${pathname}${s ? `?${s}` : ''}`, { scroll: false });
  };

  const onSearch = (value: string) => {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParams({ q: value.trim() || null }), 350);
  };

  const query = { type, q: q || undefined, page, pageSize: PAGE_SIZE };
  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: PK.records(query),
    queryFn: () => api.get<Paged<RecordItem>>('/patient/records', query),
    placeholderData: (prev) => prev,
  });

  const filtered = Boolean(type || q);

  return (
    <>
      <PageHeader
        title="Records"
        description="Your private health documents. Share one with an appointment to let that clinic see it."
        actions={<RecordUploadDialog base="/patient" appointments={shareable} onUploaded={() => void qc.invalidateQueries({ queryKey: PK.all })} />}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={text} onChange={(e) => onSearch(e.target.value)} placeholder="Search by title or file name" aria-label="Search records" className="pl-9" />
        </div>
        <Select value={type ?? 'all'} onValueChange={(v) => setParams({ type: v === 'all' ? null : v })}>
          <SelectTrigger className="w-full" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {RECORD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {RECORD_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={FileText}
          title={filtered ? 'No matching documents' : 'No documents yet'}
          description={filtered ? 'Try a different search or type.' : 'Upload prescriptions, lab reports and scans to keep everything in one place.'}
          action={
            filtered ? (
              <Button
                variant="outline"
                onClick={() => {
                  setText('');
                  setParams({ q: null, type: null });
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', isPlaceholderData && 'opacity-60')}>
            {data.items.map((r) => (
              <RecordCard key={r.id} record={r} onEdit={() => setEditing(r)} />
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => setParams({ page: p > 1 ? String(p) : null })} />
        </>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit document</DialogTitle>
            <DialogDescription>{editing?.fileName}</DialogDescription>
          </DialogHeader>
          {editing && <EditForm key={editing.id} record={editing} shareable={shareable} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
