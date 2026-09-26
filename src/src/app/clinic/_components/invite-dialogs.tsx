'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Copy, Loader2, MailWarning, UserPlus } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { clinicKeys } from './hooks';
import { copyText } from './utils';
import type { InviteResult } from './types';

export type ShownInvite = InviteResult & { email: string };

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <Input readOnly value={value} aria-label={label} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Copy ${label.toLowerCase()}`}
        onClick={async () => {
          if (await copyText(value)) {
            setCopied(true);
            toast.success('Link copied');
            setTimeout(() => setCopied(false), 2000);
          } else {
            toast.error('Couldn’t copy automatically. Select the link and copy it manually.');
          }
        }}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}

/** Shows an invite link after sending/resending. Emphasised when the email couldn't be delivered. */
export function InviteLinkDialog({ invite, onClose }: { invite: ShownInvite | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(invite)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{invite?.emailSent ? 'Invite sent' : 'Share this invite link'}</DialogTitle>
          <DialogDescription>
            {invite?.emailSent
              ? `We emailed an invitation to ${invite.email}. You can also share the link below directly.`
              : `Invite created for ${invite?.email}.`}
          </DialogDescription>
        </DialogHeader>
        {invite && !invite.emailSent && (
          <div role="alert" className="flex gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>The invitation email couldn&apos;t be sent. Copy the link and send it to them yourself — it&apos;s the only way they can join.</p>
          </div>
        )}
        {invite && <CopyField value={invite.inviteUrl} label="Invite link" />}
        <p className="text-xs text-muted-foreground">Anyone with this link can accept the invite for this email address, so share it privately.</p>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InviteDialog({ onInvited }: { onInvited: (invite: ShownInvite) => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'doctor' | 'clinic_admin'>('doctor');

  const invite = useMutation({
    mutationFn: () => api.post<InviteResult>('/clinic/team/invites', { email: email.trim(), role }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: clinicKeys.team });
      setOpen(false);
      onInvited({ ...res, email: email.trim() });
      setEmail('');
      setRole('doctor');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus /> Invite
      </Button>
      <Dialog open={open} onOpenChange={(v) => !invite.isPending && setOpen(v)}>
        <DialogContent>
          <form
            className="grid gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle>Invite a team member</DialogTitle>
              <DialogDescription>They&apos;ll get a link to join your clinic. Invites expire after a few days.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="inv-email">Email</Label>
                <Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <SelectTrigger id="inv-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="clinic_admin">Clinic admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={invite.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={!email.trim() || invite.isPending}>
                {invite.isPending && <Loader2 className="animate-spin" />}
                Send invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
