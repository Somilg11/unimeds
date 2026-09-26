'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Download, EllipsisVertical, ExternalLink, FileImage, FileText, FileUp, Loader2, Lock, Pencil, Search, Trash2 } from 'lucide-react';
import { api, errorMessage, recordFileUrl } from '@/lib/api';
import { formatBytes, formatDate, RECORD_TYPE_LABEL } from '@/lib/format';
import { RECORD_TYPES, type Paged, type RecordItem, type RecordType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, ListSkeleton, Pagination } from '@/components/app/common';
import { RecordUploadDialog } from '@/components/app/record-upload-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chip, IconCircle } from '../_components/bits';
import { ResponsiveDialog } from '@/components/app/responsive-dialog';
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
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" className="h-12 sm:h-10" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="h-12 sm:h-10" disabled={save.isPending || !title.trim()}>
          {save.isPending && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
}

function RecordCard({ record: r, onEdit, onDelete }: { record: RecordItem; onEdit: () => void; onDelete: () => void }) {
  const isImage = r.mimeType?.startsWith('image/');
  const uploader = !r.uploadedBy ? null : r.uploadedBy.role === 'patient' ? 'You' : r.uploadedBy.name;

  return (
    <li className="flex items-start gap-3 rounded-3xl bg-card p-4">
      <IconCircle icon={isImage ? FileImage : FileText} className="size-12" />
      <div className="min-w-0 flex-1">
        <a
          href={recordFileUrl(r.id)}
          target="_blank"
          rel="noopener"
          className="block truncate font-semibold hover:underline focus-visible:underline focus-visible:outline-none"
          title={r.title}
        >
          {r.title}
        </a>
        <p className="text-xs text-muted-foreground">
          {RECORD_TYPE_LABEL[r.recordType]} · <span className="tabular-nums">{formatBytes(r.fileSize)}</span> · {formatDate(r.createdAt)}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
            {r.clinic ? <Building2 className="size-3.5 shrink-0" /> : <Lock className="size-3.5 shrink-0" />}
            <span className="truncate">{r.clinic ? `Shared with ${r.clinic.name}` : 'Private'}</span>
          </span>
          {uploader && <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-muted-foreground">by {uploader}</span>}
        </div>
      </div>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="-mr-1 size-11 shrink-0" aria-label={`Actions for ${r.title}`}>
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <a href={recordFileUrl(r.id)} target="_blank" rel="noopener">
              <ExternalLink /> View
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={recordFileUrl(r.id, true)}>
              <Download /> Download
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function DeleteDialog({ record, onClose }: { record: RecordItem | null; onClose: () => void }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/patient/records/${id}`),
    onSuccess: () => {
      toast.success('Document deleted');
      void qc.invalidateQueries({ queryKey: PK.all });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <ResponsiveDialog
      open={Boolean(record)}
      onOpenChange={(v) => !v && !remove.isPending && onClose()}
      title="Delete this document?"
      description={
        record
          ? `“${record.title}” will be permanently deleted${record.clinic ? ` and no longer visible to ${record.clinic.name}` : ''}. This can’t be undone.`
          : undefined
      }
    >
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" className="h-12 sm:h-10" onClick={onClose} disabled={remove.isPending}>
          Keep it
        </Button>
        <Button variant="destructive" size="lg" className="h-12 sm:h-10" disabled={remove.isPending} onClick={() => record && remove.mutate(record.id)}>
          {remove.isPending && <Loader2 className="animate-spin" />}
          Delete
        </Button>
      </div>
    </ResponsiveDialog>
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
  const [deleting, setDeleting] = useState<RecordItem | null>(null);
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

  const clearFilters = () => {
    if (timer.current) clearTimeout(timer.current);
    setText('');
    setParams({ q: null, type: null });
  };

  return (
    <>
      <div className="mb-6 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Records</h1>
            <p className="text-sm text-muted-foreground">Private by default. Share one with a visit to let that clinic see it.</p>
          </div>
          <div className="hidden lg:block">
            <RecordUploadDialog
              base="/patient"
              appointments={shareable}
              onUploaded={() => void qc.invalidateQueries({ queryKey: PK.all })}
              trigger={
                <Button size="lg" className="h-12">
                  <FileUp /> Upload document
                </Button>
              }
            />
          </div>
        </div>
        <div className="lg:hidden">
          <RecordUploadDialog
            base="/patient"
            appointments={shareable}
            onUploaded={() => void qc.invalidateQueries({ queryKey: PK.all })}
            trigger={
              <Button size="lg" className="h-13 w-full text-base">
                <FileUp /> Upload document
              </Button>
            }
          />
        </div>
        <div className="relative lg:max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={text}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by title or file name"
            aria-label="Search records"
            className="h-13 rounded-full border-0 bg-card pl-12 text-base shadow-none"
          />
        </div>
        <div role="group" aria-label="Document type" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          <Chip active={!type} onClick={() => setParams({ type: null })}>
            All
          </Chip>
          {RECORD_TYPES.map((t) => (
            <Chip key={t} active={type === t} onClick={() => setParams({ type: t })}>
              {RECORD_TYPE_LABEL[t]}
            </Chip>
          ))}
        </div>
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
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className={cn('grid gap-3 lg:grid-cols-2 xl:grid-cols-3', isPlaceholderData && 'opacity-60')}>
            {data.items.map((r) => (
              <RecordCard key={r.id} record={r} onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} />
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => setParams({ page: p > 1 ? String(p) : null })} />
        </>
      )}

      <ResponsiveDialog open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)} title="Edit document" description={editing?.fileName}>
        {editing && <EditForm key={editing.id} record={editing} shareable={shareable} onClose={() => setEditing(null)} />}
      </ResponsiveDialog>
      <DeleteDialog record={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
