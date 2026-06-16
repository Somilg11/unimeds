'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Calendar, Users, LayoutDashboard, FileText, Settings, Menu, X, BarChart3, UserCog } from 'lucide-react';
import { LogoutButton } from '@/components/logout-button';
import { NotificationBell } from '@/components/notification-bell';

const navItems = [
  {
    href: '/clinic/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/clinic/appointments',
    label: 'Appointments',
    icon: Calendar,
  },
  {
    href: '/clinic/patients',
    label: 'Patients',
    icon: Users,
  },
  {
    href: '/clinic/records',
    label: 'Records',
    icon: FileText,
  },
  {
    href: '/clinic/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    href: '/clinic/staff',
    label: 'Manage Staff',
    icon: UserCog,
  },
  {
    href: '/clinic/settings',
    label: 'Settings',
    icon: Settings,
  },
];

interface ClinicAdminNavProps {
  userName?: string;
}

export function ClinicAdminNav({ userName }: ClinicAdminNavProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function handleLogout() {
    signOut({ callbackUrl: '/clinic' });
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-13 flex items-center justify-between px-4">
        <Link href="/clinic/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-neutral-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">U</span>
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">UniMeds</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-10 h-10 flex items-center justify-center"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
        <div className="lg:hidden fixed top-13 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="divide-y divide-gray-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-4 transition-colors',
                    isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">{userName || 'Clinic Admin'}</p>
                  <p className="text-[11px] font-mono uppercase text-gray-400">Clinic Admin</p>
                </div>
              </div>
              <NotificationBell apiPrefix="/clinic-admin" />
            </div>
            <LogoutButton
              redirectTo="/clinic"
              onLogout={handleLogout}
              className="w-full justify-start text-sm h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <span>Logout</span>
            </LogoutButton>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <nav className={cn(
        'bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col',
        'hidden lg:flex w-64 shrink-0'
      )}>
        {/* Logo */}
        <div className="h-13 border-b border-gray-200 flex items-center px-5 shrink-0">
          <Link href="/clinic/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-neutral-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">U</span>
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 tracking-tight">UniMeds</span>
              <p className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Clinic Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-px">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 h-10 px-3 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-4 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName || 'Clinic Admin'}</p>
              <p className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Clinic Admin</p>
            </div>
            <NotificationBell apiPrefix="/clinic-admin" />
          </div>
          <LogoutButton
            redirectTo="/clinic"
            onLogout={handleLogout}
            className="w-full justify-start text-sm h-10 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          >
            <span>Logout</span>
          </LogoutButton>
        </div>
      </nav>
    </>
  );
}
