'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, Calendar, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/logout-button';

const navItems = [
  {
    href: '/user/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/user/records',
    label: 'Records',
    icon: FileText,
  },
  {
    href: '/user/book',
    label: 'Book Appointment',
    icon: Calendar,
  },
  {
    href: '/user/profile',
    label: 'Profile',
    icon: User,
  },
];

interface UserNavProps {
  userName?: string;
}

export function UserNav({ userName }: UserNavProps) {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-white border-r border-zinc-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-200">
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">
          Unimeds
        </h1>
        <p className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mt-1">
          Patient Portal
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-sm h-10 transition-all duration-300',
                    isActive
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-zinc-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
            <User className="w-5 h-5 text-zinc-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 tracking-tight truncate">
              {userName || 'User'}
            </p>
            <p className="text-[10px] text-zinc-600">Patient</p>
          </div>
        </div>
        <LogoutButton
          redirectTo="/user"
          className="w-full justify-start text-sm h-10 border-dashed text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
        />
      </div>
    </nav>
  );
}
