'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarClock, CalendarDays, Loader2, MoreHorizontal, Pause, Play, RotateCw, Trash2, Users, X } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDate, initials, relativeTime, ROLE_LABEL } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/app/common';
import { ConfirmAction } from '@/components/app/confirm-action';
import { clinicKeys, useClinic, useTeam } from '../_components/hooks';
import { InviteDialog, InviteLinkDialog, type ShownInvite } from '../_components/invite-dialogs';
import { ScheduleSheet } from '../_components/schedule-sheet';
import type { InviteResult, TeamInvite, TeamMember } from '../_components/types';

type Pending = { member: TeamMember; kind: 'pause' | 'remove' } | null;

export default function ClinicTeamPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const { data: clinic } = useClinic();
  const { data, isLoading, error, refetch } = useTeam();
  const [shown, setShown] = useState<ShownInvite | null>(null);
  const [scheduleFor, setScheduleFor] = useState<TeamMember | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: clinicKeys.team });
  const memberError = (member: TeamMember) => (err: unknown) => {
    if (err instanceof ApiError && err.code === 'HAS_UPCOMING') {
      toast.error(err.message, {
        action: { label: 'View appointments', onClick: () => router.push(`/clinic/appointments?doctor=${member.user.id}`) },
        duration: 10_000,
      });
    } else toast.error(errorMessage(err));
  };

  const setActive = useMutation({
    mutationFn: ({ member, isActive }: { member: TeamMember; isActive: boolean }) => api.patch(`/clinic/team/${member.id}`, { isActive }),
    onSuccess: (_r, { member, isActive }) => toast.success(isActive ? `${member.user.name}'s access restored` : `${member.user.name}'s access paused`),
    onError: (err, { member }) => memberError(member)(err),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (member: TeamMember) => api.delete(`/clinic/team/${member.id}`),
    onSuccess: (_r, member) => toast.success(`${member.user.name} removed from the clinic`),
    onError: (err, member) => memberError(member)(err),
    onSettled: refresh,
  });
  const resend = useMutation({
    mutationFn: (invite: TeamInvite) => api.post<InviteResult>(`/clinic/team/invites/${invite.id}/resend`),
    onSuccess: (res, invite) => setShown({ ...res, email: invite.email }),
    onError: (err) => toast.error(errorMessage(err)),
    onSettled: refresh,
  });
  const revoke = useMutation({
    mutationFn: (invite: TeamInvite) => api.delete(`/clinic/team/invites/${invite.id}`),
    onSuccess: () => toast.success('Invite revoked'),
    onError: (err) => toast.error(errorMessage(err)),
    onSettled: refresh,
  });

  const members = data?.members ?? [];
  const invites = data?.invites ?? [];
  const doctors = members.filter((m) => m.role === 'doctor');
  const admins = members.filter((m) => m.role === 'clinic_admin');

  const memberRow = (m: TeamMember) => {
    const isSelf = m.user.id === session?.user?.id;
    return (
      <li key={m.id} className="flex items-center gap-4 p-4">
        <Avatar className="size-10 shrink-0">
          {m.user.avatarUrl && <AvatarImage src={m.user.avatarUrl} alt="" />}
          <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{m.user.name}</p>
            {isSelf && <Badge variant="secondary">You</Badge>}
            {!m.isActive && <Badge variant="outline">Access paused</Badge>}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {[m.user.specialization, m.user.email].filter(Boolean).join(' · ')}
          </p>
          <p className="text-xs text-muted-foreground">
            {m.role === 'doctor' && `${m.upcoming} upcoming · `}
            {m.joinedAt ? `Joined ${formatDate(m.joinedAt)}` : 'Joined'}
          </p>
        </div>
        {m.role === 'doctor' && (
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => setScheduleFor(m)}>
            <CalendarClock /> Schedule
          </Button>
        )}
        {!isSelf && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.user.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {m.role === 'doctor' && (
                <DropdownMenuItem onSelect={() => setScheduleFor(m)} className="sm:hidden">
                  <CalendarClock /> Edit schedule
                </DropdownMenuItem>
              )}
              {m.role === 'doctor' && (
                <DropdownMenuItem onSelect={() => router.push(`/clinic/appointments?doctor=${m.user.id}`)}>
                  <CalendarDays /> View appointments
                </DropdownMenuItem>
              )}
              {m.isActive ? (
                <DropdownMenuItem onSelect={() => setPending({ member: m, kind: 'pause' })}>
                  <Pause /> Pause access
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setActive.mutate({ member: m, isActive: true })}>
                  <Play /> Restore access
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setPending({ member: m, kind: 'remove' })}>
                <Trash2 /> Remove from clinic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </li>
    );
  };

  const section = (title: string, list: TeamMember[]) => (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-lg font-semibold">
        {title} <span className="text-sm font-normal text-muted-foreground">({list.length})</span>
      </h2>
      {list.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} yet`} description="Use Invite to add someone." />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">{list.map(memberRow)}</ul>
      )}
    </section>
  );

  return (
    <>
      <PageHeader title="Team" description="Doctors and administrators at your clinic." actions={<InviteDialog onInvited={setShown} />} />

      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : members.length === 0 && invites.length === 0 ? (
        <EmptyState icon={Users} title="No team members yet" action={<InviteDialog onInvited={setShown} />} />
      ) : (
        <div className="space-y-10">
          {invites.length > 0 && (
            <section className="space-y-3" aria-label="Pending invites">
              <h2 className="text-lg font-semibold">
                Pending invites <span className="text-sm font-normal text-muted-foreground">({invites.length})</span>
              </h2>
              <ul className="divide-y rounded-xl border bg-card">
                {invites.map((inv) => (
                  <li key={inv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABEL[inv.role]} · sent {relativeTime(inv.createdAt)} · expires {relativeTime(inv.expiresAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* Invite tokens are stored hashed, so copying a link means issuing a fresh one (the old link is retired) */}
                      <Button variant="outline" size="sm" disabled={resend.isPending} onClick={() => resend.mutate(inv)}>
                        {resend.isPending && resend.variables?.id === inv.id ? <Loader2 className="animate-spin" /> : <RotateCw />}
                        Resend &amp; copy link
                      </Button>
                      <ConfirmAction
                        trigger={
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <X /> Revoke
                          </Button>
                        }
                        title="Revoke this invite?"
                        description={`The link sent to ${inv.email} will stop working.`}
                        confirmLabel="Revoke invite"
                        destructive
                        onConfirm={() => revoke.mutateAsync(inv)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {section('Doctors', doctors)}
          {section('Administrators', admins)}
        </div>
      )}

      <InviteLinkDialog invite={shown} onClose={() => setShown(null)} />
      <ScheduleSheet member={scheduleFor} timezone={clinic?.timezone ?? 'UTC'} onClose={() => setScheduleFor(null)} />
      <MemberConfirm
        pending={pending}
        onClose={() => setPending(null)}
        onConfirm={async (p) => {
          if (p.kind === 'pause') await setActive.mutateAsync({ member: p.member, isActive: false });
          else await remove.mutateAsync(p.member);
        }}
      />
    </>
  );
}

/** Controlled confirm for pause/remove (opened from a dropdown, so ConfirmAction's trigger pattern doesn't fit). */
function MemberConfirm({
  pending,
  onClose,
  onConfirm,
}: {
  pending: Pending;
  onClose: () => void;
  onConfirm: (p: NonNullable<Pending>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  if (!pending) return null;
  const { member, kind } = pending;
  const name = member.user.name;
  const doctorNote = member.role === 'doctor' ? ' Doctors with upcoming appointments must have them cancelled or moved first.' : '';
  const run = async () => {
    setBusy(true);
    try {
      await onConfirm(pending);
      onClose();
    } catch {
      // toast already shown; keep the dialog open
    } finally {
      setBusy(false);
    }
  };
  return (
    <ControlledConfirm
      open
      busy={busy}
      title={kind === 'pause' ? `Pause ${name}'s access?` : `Remove ${name} from the clinic?`}
      description={
        kind === 'pause'
          ? `${name} won't be able to use this clinic or receive bookings until you restore access.${doctorNote}`
          : `${name} will lose access to this clinic${member.role === 'doctor' ? ' and their schedule here will be deleted' : ''}. You can invite them again later.${doctorNote}`
      }
      confirmLabel={kind === 'pause' ? 'Pause access' : 'Remove'}
      onCancel={onClose}
      onConfirm={run}
    />
  );
}

function ControlledConfirm({
  open,
  busy,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Back
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
