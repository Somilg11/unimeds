'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ShieldCheck, Users, Building2, ScrollText, LayoutDashboard, Menu, X } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { LogoutButton } from '@/components/logout-button';

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/clinics',
    label: 'Clinics',
    icon: Building2,
  },
  {
    href: '/admin/doctors',
    label: 'Doctors',
    icon: Users,
  },
  {
    href: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: ScrollText,
  },
];

interface AdminNavProps {
  userName?: string;
}

export function AdminNav({ userName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin');
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm border border-primary/20">
            <span className="text-white text-[13px] font-bold">U</span>
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">UniMeds</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
        >
          {isMobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-in Nav */}
      {isMobileOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-xl rounded-b-3xl overflow-hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3.5 transition-all rounded-2xl',
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5" />
                    <span className="text-[14px] font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-gray-900 truncate">{userName || 'Super Admin'}</p>
                  <p className="text-[12px] text-gray-500">Admin</p>
                </div>
              </div>
              <NotificationBell apiPrefix="/admin" />
            </div>
            <LogoutButton
              redirectTo="/admin"
              onLogout={handleLogout}
              className="w-full justify-start text-[14px] h-12 rounded-xl border-gray-200"
            >
              <span>Logout</span>
            </LogoutButton>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <nav className={cn(
        'bg-[#F8FAFA] border-r border-gray-100 h-screen sticky top-0 flex flex-col',
        'hidden lg:flex w-[260px] shrink-0'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 shrink-0 mb-4">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm border border-primary/20">
              <span className="text-white text-[14px] font-bold">U</span>
            </div>
            <div>
              <span className="text-[15px] font-bold text-gray-900 tracking-tight">UniMeds</span>
              <p className="text-[11px] text-gray-500 font-medium">Super Admin</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 h-11 px-4 text-[13.5px] font-medium transition-all rounded-xl',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 space-y-3 shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-gray-900 truncate">{userName || 'Super Admin'}</p>
              <p className="text-[12px] text-gray-500 font-medium">Admin</p>
            </div>
            <NotificationBell apiPrefix="/admin" />
          </div>
          <LogoutButton
            redirectTo="/admin"
            onLogout={handleLogout}
            className="w-full justify-start text-[13.5px] h-11 rounded-xl bg-white border-gray-200 shadow-sm hover:bg-gray-50"
          >
            <span>Logout</span>
          </LogoutButton>
        </div>
      </nav>
    </>
  );
}
