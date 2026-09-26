'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ACCEPTED_UPLOAD_TYPES, errorMessage, uploadRecord } from '@/lib/api';
import { RECORD_TYPE_LABEL } from '@/lib/format';
import { RECORD_TYPES, type RecordItem, type RecordType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slot } from 'radix-ui';
import { ResponsiveDialog } from '@/components/app/responsive-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  base: '/patient' | '/doctor';
  patientId?: string;
  /** Optional appointments the document can be attached (shared) to */
  appointments?: Array<{ id: string; label: string }>;
  defaultAppointmentId?: string;
  onUploaded?: (record: RecordItem) => void;
  trigger?: React.ReactNode;
};

export function RecordUploadDialog({ base, patientId, appointments, defaultAppointmentId, onUploaded, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('general');
  const [appointmentId, setAppointmentId] = useState<string>(defaultAppointmentId ?? 'none');
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setTitle('');
    setRecordType('general');
    setAppointmentId(defaultAppointmentId ?? 'none');
    setProgress(null);
  };

  const submit = async () => {
    if (!file) return;
    setProgress(0);
    try {
      const record = await uploadRecord(
        base,
        file,
        { recordType, title: title || undefined, appointmentId: appointmentId === 'none' ? null : appointmentId, patientId },
        setProgress
      );
      toast.success('Document uploaded');
      onUploaded?.(record);
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(errorMessage(err, 'Upload failed'));
      setProgress(null);
    }
  };

  const busy = progress !== null;
  return (
    <>
      <Slot.Root onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button>
            <FileUp /> Upload document
          </Button>
        )}
      </Slot.Root>
      <ResponsiveDialog
        open={open}
        onOpenChange={(v) => {
          if (busy) return;
          setOpen(v);
          if (!v) reset();
        }}
        title="Upload document"
        description="PDF or image, up to 15 MB. Files are stored privately."
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-4 py-8 text-sm hover:bg-muted/50"
          >
            <FileUp className="size-6 text-muted-foreground" />
            {file ? <span className="font-medium">{file.name}</span> : <span className="text-muted-foreground">Drop a file here or click to browse</span>}
          </button>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept={ACCEPTED_UPLOAD_TYPES.join(',')}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div className="space-y-1.5">
            <Label htmlFor="rec-title">Title</Label>
            <Input id="rec-title" placeholder={file?.name.replace(/\.[^.]+$/, '') ?? 'e.g. Blood test – March'} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={recordType} onValueChange={(v) => setRecordType(v as RecordType)}>
              <SelectTrigger className="w-full">
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

          {appointments && appointments.length > 0 && (
            <div className="space-y-1.5">
              <Label>Share with an appointment</Label>
              <Select value={appointmentId} onValueChange={setAppointmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep private</SelectItem>
                  {appointments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Shared documents are visible to that clinic and doctor.</p>
            </div>
          )}

          {busy && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button disabled={!file || busy} onClick={submit} className="w-full sm:w-auto" size="lg">
            {busy && <Loader2 className="animate-spin" />}
            {busy ? `Uploading ${progress}%` : 'Upload'}
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}
