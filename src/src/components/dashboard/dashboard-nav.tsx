'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, LogOut, LucideIcon } from 'lucide-react';
import { LogoutButton } from '@/components/logout-button';
import { NotificationBell } from '@/components/notification-bell';
import { signOut } from 'next-auth/react';

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

interface DashboardNavProps {
  items: DashboardNavItem[];
  userName: string;
  roleLabel: string;
  logoutHref: string;
}

export function DashboardNav({ items, userName, roleLabel, logoutHref }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header (only visible on mobile) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60 h-14 flex items-center justify-between px-4">
        <Link href={items[0]?.href || '/'} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#EBF0FE] border border-[#d4e1f7] flex items-center justify-center rounded-lg shadow-sm">
            <img src="/unimeds_logo.png" alt="UniMeds Logo" className="h-4 w-4 object-contain" />
          </div>
          <span className="text-sm font-black text-gray-900 tracking-tight leading-none">UniMeds</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 bg-white shadow-sm"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-900/40 z-40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop and Mobile) */}
      <nav className={cn(
        'fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-white border-r border-gray-200/80 transition-transform duration-300 shadow-[2px_0_12px_rgba(0,0,0,0.02)]',
        'w-64 lg:w-[280px] shrink-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo Area */}
        <div className="h-20 border-b border-gray-100 flex flex-col justify-center px-6 shrink-0 bg-white/50">
          <Link href={items[0]?.href || '/'} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative h-10 w-10 overflow-hidden rounded-[10px] border border-[#d4e1f7] bg-[#EBF0FE] shadow-sm flex items-center justify-center">
              <img src="/unimeds_logo.png" alt="UniMeds Logo" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-[#0B0A0A] leading-none block mb-0.5">UniMeds</span>
              <span className="text-[10px] font-bold text-[#246AFE] uppercase tracking-widest block leading-none">{roleLabel}</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
          <div className="space-y-1.5">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group flex items-center gap-3.5 h-12 px-4 rounded-xl text-[13px] font-bold transition-all duration-200',
                    isActive
                      ? 'bg-[#246AFE] text-white shadow-sm'
                      : 'text-gray-500 hover:bg-[#EBF0FE]/60 hover:text-[#246AFE]'
                  )}
                >
                  <Icon className={cn('w-4 h-4 transition-transform duration-200', isActive ? 'scale-110' : 'group-hover:scale-110')} strokeWidth={2.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-[10px] bg-[#EBF0FE] border border-[#d4e1f7] flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-[#246AFE] text-sm font-black">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-900 truncate leading-tight mb-0.5">{userName}</p>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Status: Active</p>
            </div>
            <NotificationBell apiPrefix={logoutHref} />
          </div>
          <LogoutButton
            redirectTo={logoutHref}
            onLogout={async () => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              localStorage.removeItem('doctor_token');
              localStorage.removeItem('doctor_user');
              await signOut({ callbackUrl: logoutHref });
            }}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white border border-gray-200 hover:bg-red-50 hover:border-red-100 hover:text-red-600 text-gray-600 font-bold transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.5} />
            <span>Sign Out</span>
          </LogoutButton>
        </div>
      </nav>
    </>
  );
}
