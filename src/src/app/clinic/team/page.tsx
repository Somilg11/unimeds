'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarClock, CalendarDays, Loader2, Mail, MoreHorizontal, Pause, Play, RotateCw, Search, Stethoscope, Trash2, Users, X } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDate, relativeTime, ROLE_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientPaged, EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/app/common';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmAction } from '@/components/app/confirm-action';
import { clinicKeys, useClinic, useTeam, useUrlState } from '../_components/hooks';
import { InviteDialog, InviteLinkDialog, type ShownInvite } from '../_components/invite-dialogs';
import { ScheduleSheet } from '../_components/schedule-sheet';
import { CountChip, IconCircle, PersonAvatar } from '../_components/panel';
import type { InviteResult, TeamInvite, TeamMember } from '../_components/types';

type Pending = { member: TeamMember; kind: 'pause' | 'remove' } | null;

export default function ClinicTeamPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={5} />}>
      <TeamPage />
    </Suspense>
  );
}

function TeamPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const { data: clinic } = useClinic();
  const { data, isLoading, error, refetch } = useTeam();
  const [shown, setShown] = useState<ShownInvite | null>(null);
  const [scheduleFor, setScheduleFor] = useState<TeamMember | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [q, setQ] = useState('');
  const { params, set } = useUrlState();
  const tabParam = params.get('tab');
  const tab = tabParam === 'admins' || tabParam === 'invites' ? tabParam : 'doctors';

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

  const memberMenu = (m: TeamMember) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.user.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {m.role === 'doctor' && (
          <DropdownMenuItem onSelect={() => setScheduleFor(m)}>
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
  );

  const statusChip = (m: TeamMember, isSelf: boolean) => (
    <span className="flex flex-wrap items-center gap-1.5">
      {isSelf && <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">You</span>}
      {m.isActive ? (
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">Active</span>
      ) : (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Paused</span>
      )}
    </span>
  );

  const person = (m: TeamMember, sub?: string | null) => (
    <span className="flex min-w-0 items-center gap-3">
      <PersonAvatar name={m.user.name} src={m.user.avatarUrl} className="size-9 text-xs" />
      <span className="min-w-0">
        <span className="block max-w-56 truncate font-semibold">{m.user.name}</span>
        <span className="block max-w-56 truncate text-xs text-muted-foreground">{sub ?? m.user.email}</span>
      </span>
    </span>
  );

  const needle = q.trim().toLowerCase();
  const match = (...fields: Array<string | null | undefined>) => !needle || fields.some((f) => f?.toLowerCase().includes(needle));
  const shownDoctors = doctors.filter((m) => match(m.user.name, m.user.email, m.user.specialization));
  const shownAdmins = admins.filter((m) => match(m.user.name, m.user.email));
  const shownInvites = invites.filter((i) => match(i.email));

  const noMatch = <p className="py-10 text-center text-sm text-muted-foreground">Nothing matches “{q}”.</p>;
  const head = (cols: Array<[string, string?]>) => (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {cols.map(([label, cls]) => (
          <TableHead key={label} className={cn('h-10 text-xs font-medium text-muted-foreground', cls)}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
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
        <Tabs value={tab} onValueChange={(v) => set({ tab: v === 'doctors' ? null : v })} className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList variant="pill" className="w-full overflow-x-auto sm:w-fit">
              <TabsTrigger value="doctors">
                Doctors <CountChip>{doctors.length}</CountChip>
              </TabsTrigger>
              <TabsTrigger value="admins">
                Administrators <CountChip>{admins.length}</CountChip>
              </TabsTrigger>
              <TabsTrigger value="invites">
                Pending <CountChip>{invites.length}</CountChip>
              </TabsTrigger>
            </TabsList>
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tab === 'invites' ? 'Search email' : 'Search name or email'}
                aria-label="Search team"
                className="h-11 rounded-full border-0 bg-card pl-11"
              />
            </div>
          </div>

          <TabsContent value="doctors" className="rounded-3xl bg-card p-2 sm:p-4">
            {doctors.length === 0 ? (
              <EmptyState icon={Stethoscope} title="No doctors yet" description="Use Invite to add a doctor to your clinic." />
            ) : shownDoctors.length === 0 ? (
              noMatch
            ) : (
              <ClientPaged items={shownDoctors}>
                {(rows) => (
                  <Table>
                    {head([['Doctor'], ['Specialty', 'hidden md:table-cell'], ['Status'], ['Upcoming', 'text-right'], ['Joined', 'hidden lg:table-cell'], ['', 'w-0']])}
                    <TableBody>
                      {rows.map((m) => {
                        const isSelf = m.user.id === session?.user?.id;
                        return (
                          <TableRow key={m.id} className={cn(!m.isActive && 'opacity-70')}>
                            <TableCell className="py-3">{person(m)}</TableCell>
                            <TableCell className="hidden text-muted-foreground md:table-cell">{m.user.specialization ?? '—'}</TableCell>
                            <TableCell>{statusChip(m, isSelf)}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">{m.upcoming}</TableCell>
                            <TableCell className="hidden text-muted-foreground lg:table-cell">{m.joinedAt ? formatDate(m.joinedAt) : '—'}</TableCell>
                            <TableCell>
                              <span className="flex items-center justify-end gap-1">
                                <Button variant="outline" size="sm" onClick={() => setScheduleFor(m)}>
                                  <CalendarClock /> <span className="hidden xl:inline">Schedule</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => router.push(`/clinic/appointments?doctor=${m.user.id}`)}
                                  aria-label={`Bookings for ${m.user.name}`}
                                >
                                  <CalendarDays />
                                </Button>
                                {!isSelf && memberMenu(m)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ClientPaged>
            )}
          </TabsContent>

          <TabsContent value="admins" className="rounded-3xl bg-card p-2 sm:p-4">
            {admins.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No administrators yet.</p>
            ) : shownAdmins.length === 0 ? (
              noMatch
            ) : (
              <ClientPaged items={shownAdmins}>
                {(rows) => (
                  <Table>
                    {head([['Administrator'], ['Status'], ['Joined', 'hidden sm:table-cell'], ['', 'w-0']])}
                    <TableBody>
                      {rows.map((m) => {
                        const isSelf = m.user.id === session?.user?.id;
                        return (
                          <TableRow key={m.id} className={cn(!m.isActive && 'opacity-70')}>
                            <TableCell className="py-3">{person(m)}</TableCell>
                            <TableCell>{statusChip(m, isSelf)}</TableCell>
                            <TableCell className="hidden text-muted-foreground sm:table-cell">{m.joinedAt ? formatDate(m.joinedAt) : '—'}</TableCell>
                            <TableCell className="text-right">{!isSelf && memberMenu(m)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ClientPaged>
            )}
          </TabsContent>

          <TabsContent value="invites" className="rounded-3xl bg-card p-2 sm:p-4">
            {invites.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <IconCircle icon={Mail} tone="muted" className="mb-3 size-12" />
                <p className="text-sm text-muted-foreground">No pending invites.</p>
              </div>
            ) : shownInvites.length === 0 ? (
              noMatch
            ) : (
              <ClientPaged items={shownInvites}>
                {(rows) => (
                  <Table>
                    {head([['Email'], ['Role'], ['Sent', 'hidden md:table-cell'], ['Expires', 'hidden sm:table-cell'], ['', 'w-0']])}
                    <TableBody>
                      {rows.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="py-3">
                            <span className="flex min-w-0 items-center gap-3">
                              <IconCircle icon={Mail} className="size-9" />
                              <span className="block max-w-64 truncate font-medium">{inv.email}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{ROLE_LABEL[inv.role]}</span>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">{relativeTime(inv.createdAt)}</TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">{relativeTime(inv.expiresAt)}</TableCell>
                          <TableCell>
                            <span className="flex items-center justify-end gap-1">
                              {/* Invite tokens are stored hashed, so copying a link means issuing a fresh one (the old link is retired) */}
                              <Button variant="outline" size="sm" disabled={resend.isPending} onClick={() => resend.mutate(inv)}>
                                {resend.isPending && resend.variables?.id === inv.id ? <Loader2 className="animate-spin" /> : <RotateCw />}
                                <span className="hidden lg:inline">Resend &amp; copy</span>
                              </Button>
                              <ConfirmAction
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:text-destructive"
                                    aria-label={`Revoke invite for ${inv.email}`}
                                  >
                                    <X />
                                  </Button>
                                }
                                title="Revoke this invite?"
                                description={`The link sent to ${inv.email} will stop working.`}
                                confirmLabel="Revoke invite"
                                destructive
                                onConfirm={() => revoke.mutateAsync(inv)}
                              />
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ClientPaged>
            )}
          </TabsContent>
        </Tabs>
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
