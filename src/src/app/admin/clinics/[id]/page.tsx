'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, CalendarClock, CalendarDays, Loader2, MailPlus, Pencil, ScrollText, Stethoscope, UserCog, Users } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, relativeTime, ROLE_LABEL, zoneLabel } from '@/lib/format';
import { ConfirmAction } from '@/components/app/confirm-action';
import { EmptyState, ErrorState, ListSkeleton, StatCard } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ActiveBadge, ClinicStatusBadge } from '../../_components/bits';
import { InviteDialog } from '../../_components/invite-dialog';
import { PLANS, PLAN_LABEL, type AdminClinic, type AdminClinicDetail, type ClinicMemberRole, type Plan } from '../../_components/types';

type InviteState = { open: boolean; email: string; role: ClinicMemberRole; title: string };

export default function ClinicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [invite, setInvite] = useState<InviteState>({ open: false, email: '', role: 'doctor', title: 'Invite a member' });
  const [noAdmin, setNoAdmin] = useState<string | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['admin', 'clinic', id],
    queryFn: () => api.get<AdminClinicDetail>(`/admin/clinics/${id}`),
  });

  const patch = useMutation({
    mutationFn: (body: { name?: string; plan?: Plan; status?: 'active' | 'suspended' }) => api.patch<{ clinic: AdminClinic }>(`/admin/clinics/${id}`, body),
    onSuccess: (_res, body) => {
      setNoAdmin(null);
      toast.success(
        body.status === 'suspended' ? 'Clinic suspended' : body.status === 'active' ? 'Clinic reactivated' : body.plan ? `Plan changed to ${PLAN_LABEL[body.plan]}` : 'Clinic renamed'
      );
      qc.invalidateQueries({ queryKey: ['admin', 'clinic', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'NO_ADMIN') {
        setNoAdmin(err.message);
        qc.invalidateQueries({ queryKey: ['admin', 'clinic', id] });
      } else toast.error(errorMessage(err));
    },
  });

  if (isPending) return <ListSkeleton rows={6} />;
  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      </div>
    );
  }

  const { clinic, members, invites, stats } = data;
  const activeDoctors = members.filter((m) => m.role === 'doctor' && m.isActive).length;
  const activeAdmins = members.filter((m) => m.role === 'clinic_admin' && m.isActive).length;
  const openInvite = (s: Omit<InviteState, 'open'>) => setInvite({ ...s, open: true });
  const resendOwner = () => openInvite({ email: clinic.email, role: 'clinic_admin', title: 'Resend owner invite' });
  const location = [clinic.address, clinic.city, clinic.state, clinic.zipCode].filter(Boolean).join(', ');

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BackLink />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{clinic.name}</h1>
              <ClinicStatusBadge status={clinic.status} />
            </div>
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <div>
                <dt className="sr-only">Owner email</dt>
                <dd>{clinic.email}</dd>
              </div>
              {clinic.phone && (
                <div>
                  <dt className="sr-only">Phone</dt>
                  <dd>{clinic.phone}</dd>
                </div>
              )}
              {location && (
                <div>
                  <dt className="sr-only">Location</dt>
                  <dd>{location}</dd>
                </div>
              )}
              <div>
                <dt className="sr-only">Timezone</dt>
                <dd>
                  {clinic.timezone.replace(/_/g, ' ')} ({zoneLabel(clinic.timezone)})
                </dd>
              </div>
              <div>
                <dt className="sr-only">Created</dt>
                <dd>
                  Created {formatDate(clinic.createdAt)}
                  {clinic.activatedAt && ` · activated ${formatDate(clinic.activatedAt)}`}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RenameDialog current={clinic.name} busy={patch.isPending} onSave={(name) => patch.mutateAsync({ name })} />
            <Select value={clinic.plan} onValueChange={(v) => v !== clinic.plan && patch.mutate({ plan: v as Plan })} disabled={patch.isPending}>
              <SelectTrigger className="w-40" aria-label="Plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLAN_LABEL[p]} plan
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clinic.status === 'suspended' ? (
              <ConfirmAction
                trigger={<Button>Reactivate</Button>}
                title={`Reactivate ${clinic.name}?`}
                description="Its admins, doctors and patients regain access, and new bookings open again."
                confirmLabel="Reactivate"
                onConfirm={() => patch.mutateAsync({ status: 'active' })}
              />
            ) : (
              <ConfirmAction
                trigger={<Button variant="destructive">Suspend</Button>}
                title={`Suspend ${clinic.name}?`}
                description="Staff lose access to this clinic and patients can no longer book here. Existing data is kept, and you can reactivate at any time."
                confirmLabel="Suspend clinic"
                destructive
                onConfirm={() => patch.mutateAsync({ status: 'suspended' })}
              />
            )}
          </div>
        </div>
      </div>

      {(noAdmin || clinic.status === 'invited') && (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              {noAdmin ??
                `This clinic becomes active once its admin (${clinic.email}) accepts the invitation. If they can't find it or the link has expired, resend it.`}
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={resendOwner}>
            <MailPlus /> Resend owner invite
          </Button>
        </div>
      )}

      <section aria-labelledby="stats-heading" className="space-y-3">
        <h2 id="stats-heading" className="sr-only">
          Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Appointments" value={stats.total} icon={CalendarDays} />
          <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarClock} />
          <StatCard label="Patients seen" value={stats.patients} icon={Users} />
          <StatCard label="Doctors" value={activeDoctors} icon={Stethoscope} />
          <StatCard label="Admins" value={activeAdmins} icon={UserCog} />
        </div>
      </section>

      <section aria-labelledby="members-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="members-heading" className="text-lg font-semibold">
            Members
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/audit?clinicId=${clinic.id}`}>
                <ScrollText /> Audit log
              </Link>
            </Button>
            <Button onClick={() => openInvite({ email: '', role: 'doctor', title: 'Invite a member' })}>
              <MailPlus /> Invite admin or doctor
            </Button>
          </div>
        </div>
        {members.length === 0 ? (
          <EmptyState icon={Users} title="No members yet" description="Members appear here once they accept an invitation." />
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.user.name}</div>
                      <div className="text-xs text-muted-foreground">{m.user.email}</div>
                    </TableCell>
                    <TableCell>{ROLE_LABEL[m.role]}</TableCell>
                    <TableCell>
                      <ActiveBadge active={m.isActive} inactiveLabel="Removed" />
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={m.user.isActive} inactiveLabel="Deactivated" />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(m.joinedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section aria-labelledby="invites-heading" className="space-y-3">
        <h2 id="invites-heading" className="text-lg font-semibold">
          Pending invites
        </h2>
        {invites.length === 0 ? (
          <EmptyState icon={MailPlus} title="No pending invites" />
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <InviteRow key={inv.id} clinicId={clinic.id} invite={inv} onResend={() => openInvite({ email: inv.email, role: inv.role, title: 'Resend invite' })} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <InviteDialog
        clinicId={clinic.id}
        clinicName={clinic.name}
        open={invite.open}
        onOpenChange={(open) => setInvite((s) => ({ ...s, open }))}
        defaultEmail={invite.email}
        defaultRole={invite.role}
        title={invite.title}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/clinics" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Clinics
    </Link>
  );
}

function InviteRow({ clinicId, invite, onResend }: { clinicId: string; invite: AdminClinicDetail['invites'][number]; onResend: () => void }) {
  const qc = useQueryClient();
  const revoke = useMutation({
    mutationFn: () => api.delete(`/admin/clinics/${clinicId}/invites/${invite.id}`),
    onSuccess: () => {
      toast.success('Invite revoked');
      qc.invalidateQueries({ queryKey: ['admin', 'clinic', clinicId] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <TableRow>
      <TableCell className="font-medium">{invite.email}</TableCell>
      <TableCell>{ROLE_LABEL[invite.role]}</TableCell>
      <TableCell className="text-muted-foreground" title={formatDateTime(invite.createdAt)}>
        {relativeTime(invite.createdAt)}
      </TableCell>
      <TableCell className="text-muted-foreground" title={formatDateTime(invite.expiresAt)}>
        {relativeTime(invite.expiresAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onResend}>
            Resend
          </Button>
          <ConfirmAction
            trigger={
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                Revoke
              </Button>
            }
            title="Revoke this invite?"
            description={`The link sent to ${invite.email} will stop working.`}
            confirmLabel="Revoke invite"
            destructive
            onConfirm={() => revoke.mutateAsync()}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function RenameDialog({ current, busy, onSave }: { current: string; busy: boolean; onSave: (name: string) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(current);
  const trimmed = name.trim();
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (busy) return;
        setOpen(v);
        if (v) setName(current);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil /> Rename
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await onSave(trimmed);
              setOpen(false);
            } catch {
              // toast shown by the mutation; keep the dialog open
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Rename clinic</DialogTitle>
            <DialogDescription>The clinic&apos;s public URL slug does not change.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="clinic-name">Clinic name</Label>
            <Input id="clinic-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || trimmed.length < 2 || trimmed === current}>
              {busy && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
