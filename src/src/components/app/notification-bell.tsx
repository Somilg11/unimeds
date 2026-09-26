'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import type { Notification, Paged } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Resp = Paged<Notification> & { unreadCount: number };

export function NotificationBell() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => api.get<Resp>('/notifications', { pageSize: 10 }),
    refetchInterval: 60_000,
  });
  const markRead = useMutation({
    mutationFn: (body: { all: true } | { ids: string[] }) => api.post('/notifications/read', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.unreadCount ?? 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 && (
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => markRead.mutate({ all: true })}>
              Mark all read
            </button>
          )}
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {(data?.items ?? []).length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</li>}
          {data?.items.map((n) => {
            const body = (
              <div className="space-y-0.5">
                <p className={cn('text-sm', !n.readAt && 'font-medium')}>{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</p>
              </div>
            );
            const onClick = () => !n.readAt && markRead.mutate({ ids: [n.id] });
            return (
              <li key={n.id} className={cn('border-b last:border-0', !n.readAt && 'bg-primary/5')}>
                {n.link ? (
                  <Link href={n.link} onClick={onClick} className="block px-4 py-3 hover:bg-muted">
                    {body}
                  </Link>
                ) : (
                  <button onClick={onClick} className="block w-full px-4 py-3 text-left hover:bg-muted">
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
