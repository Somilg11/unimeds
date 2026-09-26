'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

/**
 * Confirmation dialog for consequential actions, optionally collecting a reason.
 * `onConfirm` may throw; the dialog stays open so the user can retry.
 */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive,
  reason,
  confirmPhrase,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  reason?: { label: string; required?: boolean; placeholder?: string };
  /** Require the user to type this exact phrase before confirming (e.g. "DELETE") */
  confirmPhrase?: string;
  onConfirm: (reason?: string) => Promise<unknown> | unknown;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await onConfirm(reason || confirmPhrase ? text.trim() || undefined : undefined);
      setOpen(false);
      setText('');
    } catch {
      // caller surfaces the error (toast); keep dialog open
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {confirmPhrase && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-phrase">
              Type <span className="font-mono font-semibold">{confirmPhrase}</span> to confirm
            </Label>
            <Input id="confirm-phrase" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
          </div>
        )}
        {reason && !confirmPhrase && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-reason">{reason.label}</Label>
            <Textarea id="confirm-reason" value={text} onChange={(e) => setText(e.target.value)} placeholder={reason.placeholder} maxLength={500} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Back
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={run} disabled={busy || (confirmPhrase ? text.trim() !== confirmPhrase : Boolean(reason?.required && !text.trim()))}>
            {busy && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
