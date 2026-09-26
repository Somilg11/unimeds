'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, relativeTime, ROLE_LABEL } from '@/lib/format';
import type { Paged, Role } from '@/lib/types';
import { ConfirmAction } from '@/components/app/confirm-action';
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActiveBadge, Identity, Panel, RolePill, TABLE_HEAD_ROW } from '../_components/bits';
import { SearchInput, useUrlState } from '../_components/url-state';
import type { AdminUserRow } from '../_components/types';

const ROLES: Role[] = ['patient', 'doctor', 'clinic_admin', 'super_admin'];

export default function UsersPage() {
  return (
    <>
      <PageHeader title="Users" description="Everyone with a Unimeds account." />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <UsersList />
      </Suspense>
    </>
  );
}

function UsersList() {
  const { get, set, page } = useUrlState();
  const pageSize = Number(get('size')) || 20;
  const q = get('q');
  const role = get('role');
  const { data: session } = useSession();
  const myId = session?.user?.id;

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['admin', 'users', { q, role, page, pageSize }],
    queryFn: () => api.get<Paged<AdminUserRow>>('/admin/users', { q, role, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={role || 'all'} onValueChange={(v) => set({ role: v === 'all' ? null : v })}>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="h-10 bg-card" aria-label="Filter by role">
              <TabsTrigger value="all" className="px-4">
                All
              </TabsTrigger>
              {ROLES.map((r) => (
                <TabsTrigger key={r} value={r} className="px-4">
                  {ROLE_LABEL[r]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <SearchInput label="Search users" placeholder="Name or email" value={q} onSearch={(v) => set({ q: v })} />
      </div>

      {isPending ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description={q || role ? 'Try a different search or role.' : undefined} />
      ) : (
        <>
          <Panel flush title="Accounts" description={`${data.total} ${data.total === 1 ? 'user' : 'users'}`} className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEAD_ROW}>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Clinics</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Created</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((u) => (
                  <UserRow key={u.id} user={u} isSelf={u.id === myId} />
                ))}
              </TableBody>
            </Table>
          </Panel>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={(p) => set({ page: p })} onPageSize={(n) => set({ size: n === 20 ? null : n })} />
        </>
      )}
    </div>
  );
}

function UserRow({ user, isSelf }: { user: AdminUserRow; isSelf: boolean }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (isActive: boolean) => api.patch(`/admin/users/${user.id}`, { isActive }),
    onSuccess: (_res, isActive) => {
      toast.success(isActive ? `${user.name} activated` : `${user.name} deactivated`);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <TableRow>
      <TableCell className="py-3.5">
        <Identity name={user.name} sub={user.email}>
          {user.name}
          {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
        </Identity>
      </TableCell>
      <TableCell>
        <RolePill role={user.role} />
      </TableCell>
      <TableCell className="max-w-56 truncate" title={user.clinics.join(', ')}>
        {user.clinics.length ? user.clinics.join(', ') : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <ActiveBadge active={user.isActive} inactiveLabel="Deactivated" />
      </TableCell>
      <TableCell className="text-muted-foreground" title={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : undefined}>
        {user.lastLoginAt ? relativeTime(user.lastLoginAt) : 'Never'}
      </TableCell>
      <TableCell className="hidden text-muted-foreground 2xl:table-cell">{formatDate(user.createdAt)}</TableCell>
      <TableCell className="text-right">
        {!isSelf &&
          (user.isActive ? (
            <ConfirmAction
              trigger={
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  Deactivate
                </Button>
              }
              title={`Deactivate ${user.name}?`}
              description="They are signed out everywhere immediately and can't sign in until reactivated. Their data is kept."
              confirmLabel="Deactivate"
              destructive
              onConfirm={() => toggle.mutateAsync(false)}
            />
          ) : (
            <ConfirmAction
              trigger={
                <Button variant="outline" size="sm">
                  Activate
                </Button>
              }
              title={`Activate ${user.name}?`}
              description="They will be able to sign in again."
              confirmLabel="Activate"
              onConfirm={() => toggle.mutateAsync(true)}
            />
          ))}
      </TableCell>
    </TableRow>
  );
}
