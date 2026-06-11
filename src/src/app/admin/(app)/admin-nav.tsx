'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ShieldCheck, Users, Building2, ScrollText, LayoutDashboard, Menu, X, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notification-bell';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin');
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-zinc-900 text-white hover:bg-zinc-800"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <nav className={cn(
        'bg-white border-r border-zinc-200 h-screen sticky top-0 flex flex-col transition-all duration-300 z-50',
        isCollapsed ? 'w-16' : 'w-64',
        isMobileOpen ? 'fixed left-0 top-0' : 'relative',
        'lg:relative lg:z-auto'
      )}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">
                Unimeds
              </h1>
              <p className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mt-1">
                Super Admin Portal
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-zinc-600 hover:text-zinc-900 hidden lg:flex"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="text-zinc-600 hover:text-zinc-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full transition-all duration-300',
                      isCollapsed
                        ? 'justify-center px-0 h-10'
                        : 'justify-start text-sm h-10',
                      isActive
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn('w-4 h-4 mr-3 shrink-0', isCollapsed ? 'mr-0' : '')} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-zinc-200 space-y-3">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-zinc-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 tracking-tight truncate">
                  {userName || 'Super Admin'}
                </p>
                <p className="text-[10px] text-zinc-600">Super Admin</p>
              </div>
              <NotificationBell apiPrefix="/admin" />
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <NotificationBell apiPrefix="/admin" />
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleLogout}
            className={cn(
              'w-full transition-all duration-300',
              isCollapsed
                ? 'justify-center px-0 h-10'
                : 'justify-start text-sm h-10 border-dashed text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            )}
          >
            <LogOut className={cn('w-4 h-4 shrink-0', isCollapsed ? '' : 'mr-2')} />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </nav>
    </>
  );
}
