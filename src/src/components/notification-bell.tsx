'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown> | null;
}

interface NotificationBellProps {
  apiPrefix?: string;
}

export function NotificationBell({ apiPrefix = '/clinic-admin' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const readIdsRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [apiPrefix]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current && 
      !containerRef.current.contains(e.target as Node) &&
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  function handleToggle() {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const margin = 8;
      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth - margin) {
        left = window.innerWidth - margin - dropdownWidth;
      }
      if (left < margin) left = margin;
      setDropdownPos({ top: rect.top - 8, left });
    }
    setIsOpen(!isOpen);
  }

  async function fetchNotifications() {
    try {
      const res = await apiClient.get(`${apiPrefix}/notifications`);
      const data = res.data;
      const serverNotifs: Notification[] = data?.notifications || [];

      setNotifications((prev) => {
        const prevMap = new Map(prev.map((n) => [n.id, n]));
        return serverNotifs.map((sn) => {
          if (readIdsRef.current.has(sn.id)) {
            return { ...sn, isRead: true };
          }
          const existing = prevMap.get(sn.id);
          if (existing?.isRead) {
            return { ...sn, isRead: true };
          }
          return sn;
        });
      });
    } catch {
      // ignore
    }
  }

  async function markAsRead(id: string) {
    if (readIdsRef.current.has(id)) return;
    readIdsRef.current.add(id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await apiClient.put(`${apiPrefix}/notifications`, { notificationId: id });
    } catch {
      // optimistic update stays
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    unreadIds.forEach((id) => readIdsRef.current.add(id));

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await apiClient.put(`${apiPrefix}/notifications`, { all: true });
    } catch {
      // optimistic update stays
    }
  }

  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-80 bg-white border border-gray-200 shadow-lg z-[9999] flex flex-col"
          style={{
            bottom: `${window.innerHeight - dropdownPos.top + 8}px`,
            left: `${dropdownPos.left}px`,
            maxHeight: 'min(calc(100vh - 8rem), 480px)',
          }}
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-200 shrink-0">
            <h3 className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-mono uppercase text-gray-400 hover:text-gray-900 flex items-center gap-1 tracking-wider"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'min(calc(100vh - 11rem), 440px)' }}>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No notifications</div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notif.isRead ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-blue-500 mt-1.5 shrink-0 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{notif.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] font-mono uppercase text-gray-400 mt-1 tracking-wider">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative" ref={containerRef}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="relative h-8 w-8 shrink-0"
      >
        <Bell className="w-4 h-4 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      {dropdown}
    </div>
  );
}
