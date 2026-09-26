'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  Globe,
  Loader2,
  Mail,
  MailPlus,
  MapPin,
  Pencil,
  Phone,
  ScrollText,
  Stethoscope,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, initials, relativeTime, zoneLabel } from '@/lib/format';
import { ConfirmAction } from '@/components/app/confirm-action';
import { EmptyState, ErrorState, ListSkeleton, StatCard, ClientPaged } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ActiveBadge, ClinicStatusBadge, IconCircle, Identity, Panel, RolePill, TABLE_HEAD_ROW } from '../../_components/bits';
import { InviteDialog } from '../../_components/invite-dialog';
import { PLANS, PLAN_LABEL, type AdminClinic, type AdminClinicDetail, type ClinicMemberRole, type Plan } from '../../_components/types';

type InviteState = {
  open: boolean;
  email: string;
  role: ClinicMemberRole;
  title: string;
};

export default function ClinicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [invite, setInvite] = useState<InviteState>({
    open: false,
    email: '',
    role: 'doctor',
    title: 'Invite a member',
  });
  const [noAdmin, setNoAdmin] = useState<string | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['admin', 'clinic', id],
    queryFn: () => api.get<AdminClinicDetail>(`/admin/clinics/${id}`),
  });

  const patch = useMutation({
    mutationFn: (body: { name?: string; plan?: Plan; status?: 'active' | 'suspended' }) =>
      api.patch<{ clinic: AdminClinic }>(`/admin/clinics/${id}`, body),
    onSuccess: (_res, body) => {
      setNoAdmin(null);
      toast.success(
        body.status === 'suspended'
          ? 'Clinic suspended'
          : body.status === 'active'
            ? 'Clinic reactivated'
            : body.plan
              ? `Plan changed to ${PLAN_LABEL[body.plan]}`
              : 'Clinic renamed',
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

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-48 rounded-3xl" />
        <ListSkeleton rows={3} />
      </div>
    );
  }
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
  const resendOwner = () =>
    openInvite({
      email: clinic.email,
      role: 'clinic_admin',
      title: 'Resend owner invite',
    });
  const location = [clinic.address, clinic.city, clinic.state, clinic.zipCode].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <BackLink />

      <section aria-labelledby="clinic-heading" className="rounded-3xl bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar className="size-16">
              {clinic.logoUrl && <AvatarImage src={clinic.logoUrl} alt="" />}
              <AvatarFallback className="bg-accent text-lg font-bold text-accent-foreground">{initials(clinic.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 id="clinic-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {clinic.name}
                </h1>
                <ClinicStatusBadge status={clinic.status} />
                <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{PLAN_LABEL[clinic.plan]} plan</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Created {formatDate(clinic.createdAt)}
                {clinic.activatedAt && ` · activated ${formatDate(clinic.activatedAt)}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RenameDialog current={clinic.name} busy={patch.isPending} onSave={(name) => patch.mutateAsync({ name })} />
            <Select value={clinic.plan} onValueChange={(v) => v !== clinic.plan && patch.mutate({ plan: v as Plan })} disabled={patch.isPending}>
              <SelectTrigger className="w-40 rounded-full" aria-label="Plan">
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

        <dl className="mt-5 flex flex-wrap gap-2 border-t pt-5 text-sm">
          <MetaChip icon={Mail} label="Owner email">
            {clinic.email}
          </MetaChip>
          {clinic.phone && (
            <MetaChip icon={Phone} label="Phone">
              {clinic.phone}
            </MetaChip>
          )}
          {location && (
            <MetaChip icon={MapPin} label="Location">
              {location}
            </MetaChip>
          )}
          <MetaChip icon={Globe} label="Timezone">
            {clinic.timezone.replace(/_/g, ' ')} ({zoneLabel(clinic.timezone)})
          </MetaChip>
        </dl>
      </section>

      {(noAdmin || clinic.status === 'invited') && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-3xl border-2 border-primary/30 bg-card p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex items-center gap-3">
            <IconCircle icon={AlertTriangle} />
            <p>
              {noAdmin ??
                `This clinic becomes active once its admin (${clinic.email}) accepts the invitation. If they can't find it or the link has expired, resend it.`}
            </p>
          </div>
          <Button variant="secondary" size="sm" className="shrink-0" onClick={resendOwner}>
            <MailPlus /> Resend owner invite
          </Button>
        </div>
      )}

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarClock} highlight />
          <StatCard label="Appointments" value={stats.total} icon={CalendarDays} />
          <StatCard label="Patients seen" value={stats.patients} icon={Users} />
          <StatCard label="Doctors" value={activeDoctors} icon={Stethoscope} />
          <StatCard label="Admins" value={activeAdmins} icon={UserCog} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          flush
          className="min-w-0 xl:col-span-2"
          title="Members"
          titleId="members-heading"
          description={`${members.length} ${members.length === 1 ? 'person' : 'people'} linked to this clinic`}
          actions={
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/audit?clinicId=${clinic.id}`}>
                  <ScrollText /> Audit log
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  openInvite({
                    email: '',
                    role: 'doctor',
                    title: 'Invite a member',
                  })
                }
              >
                <MailPlus /> Invite admin or doctor
              </Button>
            </>
          }
        >
          {members.length === 0 ? (
            <EmptyState icon={Users} title="No members yet" description="Members appear here once they accept an invitation." />
          ) : (
            <ClientPaged items={members}>
              {(rows) => (
                <Table>
                  <TableHeader>
                    <TableRow className={TABLE_HEAD_ROW}>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="py-3.5">
                          <Identity name={m.user.name} sub={m.user.email} />
                        </TableCell>
                        <TableCell>
                          <RolePill role={m.role} />
                        </TableCell>
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
              )}
            </ClientPaged>
          )}
        </Panel>

        <Panel
          title="Pending invites"
          titleId="invites-heading"
          description={invites.length ? `${invites.length} awaiting a reply` : undefined}
          className="min-w-0"
        >
          {invites.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <IconCircle icon={MailPlus} className="mb-3 size-12" />
              <p className="font-semibold">No pending invites</p>
              <p className="mt-1 text-sm text-muted-foreground">Invitations you send show up here until accepted.</p>
            </div>
          ) : (
            <ul className="-my-3 divide-y">
              {invites.map((inv) => (
                <InviteRow
                  key={inv.id}
                  clinicId={clinic.id}
                  invite={inv}
                  onResend={() =>
                    openInvite({
                      email: inv.email,
                      role: inv.role,
                      title: 'Resend invite',
                    })
                  }
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

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

function MetaChip({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-muted py-1.5 pr-3.5 pl-1.5">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground" aria-hidden>
        <Icon className="size-3.5" />
      </span>
      <dt className="sr-only">{label}</dt>
      <dd className="truncate">{children}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/clinics" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> All clinics
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
    <li className="space-y-3 py-4">
      <div className="flex items-start gap-3">
        <IconCircle icon={Mail} tone="muted" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" title={invite.email}>
            {invite.email}
          </p>
          <p className="text-xs text-muted-foreground">
            <span title={formatDateTime(invite.createdAt)}>Sent {relativeTime(invite.createdAt)}</span> ·{' '}
            <span title={formatDateTime(invite.expiresAt)}>expires {relativeTime(invite.expiresAt)}</span>
          </p>
        </div>
        <RolePill role={invite.role} />
      </div>
      <div className="flex gap-2 pl-13">
        <Button variant="outline" size="sm" onClick={onResend}>
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
    </li>
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
