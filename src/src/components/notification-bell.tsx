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
          className="fixed w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-[9999] flex flex-col overflow-hidden"
          style={{
            bottom: `${window.innerHeight - dropdownPos.top + 12}px`,
            left: `${dropdownPos.left}px`,
            maxHeight: 'min(calc(100vh - 8rem), 480px)',
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
            <h3 className="text-[14px] font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] font-medium text-[#36565F] hover:text-[#36565F]/80 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'min(calc(100vh - 11rem), 440px)' }}>
            {notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
                <Bell className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-[13px] font-medium text-gray-500">No notifications yet</p>
                <p className="text-[11px] text-gray-400 mt-1">When you get notifications, they'll show up here</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                  <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50/80 transition-colors ${
                    !notif.isRead ? 'bg-[#E2F0F0]/30' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    {!notif.isRead ? (
                      <span className="w-2 h-2 bg-[#36565F] mt-1.5 shrink-0 rounded-full" />
                    ) : (
                      <span className="w-2 h-2 mt-1.5 shrink-0 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] truncate ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">
                        {new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
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
        className="relative h-9 w-9 shrink-0 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-4 h-4 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
          </span>
        )}
      </Button>
      {dropdown}
    </div>
  );
}
