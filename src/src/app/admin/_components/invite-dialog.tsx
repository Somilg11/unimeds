'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InviteLinkResult } from './bits';
import type { ClinicMemberRole, InviteResult } from './types';

/** Invite (or re-invite) a clinic admin or doctor. Controlled so callers can open it with defaults. */
export function InviteDialog({
  clinicId,
  clinicName,
  open,
  onOpenChange,
  defaultEmail = '',
  defaultRole = 'doctor',
  title = 'Invite a member',
}: {
  clinicId: string;
  clinicName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  defaultRole?: ClinicMemberRole;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Remount the form each time the dialog opens so defaults apply and old results clear */}
        {open && (
          <InviteForm
            clinicId={clinicId}
            clinicName={clinicName}
            defaultEmail={defaultEmail}
            defaultRole={defaultRole}
            title={title}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({
  clinicId,
  clinicName,
  defaultEmail,
  defaultRole,
  title,
  onClose,
}: {
  clinicId: string;
  clinicName: string;
  defaultEmail: string;
  defaultRole: ClinicMemberRole;
  title: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState(defaultEmail);
  const [role, setRole] = useState<ClinicMemberRole>(defaultRole);
  const [result, setResult] = useState<InviteResult | null>(null);

  const invite = useMutation({
    mutationFn: () => api.post<InviteResult>(`/admin/clinics/${clinicId}/invites`, { email: email.trim(), role }),
    onSuccess: (res) => {
      setResult(res);
      toast.success('Invitation created');
      qc.invalidateQueries({ queryKey: ['admin', 'clinic', clinicId] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (result) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Invitation ready</DialogTitle>
          <DialogDescription>
            {email.trim()} was invited to {clinicName} as {role === 'clinic_admin' ? 'a clinic admin' : 'a doctor'}.
          </DialogDescription>
        </DialogHeader>
        <InviteLinkResult url={result.inviteUrl} emailSent={result.emailSent} email={email.trim()} />
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        invite.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>They&apos;ll receive a single-use link to join {clinicName}. Any earlier pending invite for this email and role is replaced.</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-role">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as ClinicMemberRole)}>
          <SelectTrigger id="invite-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clinic_admin">Clinic admin</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={invite.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={invite.isPending || !email.trim()}>
          {invite.isPending && <Loader2 className="animate-spin" />}
          Send invite
        </Button>
      </DialogFooter>
    </form>
  );
}
