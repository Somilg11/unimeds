'use client';

import { Building2, LayoutDashboard, ScrollText, UserCog, Users } from 'lucide-react';
import { AppShell, type NavItem } from '@/components/app/app-shell';

const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/clinics', label: 'Clinics', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
  { href: '/admin/account', label: 'Account', icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={NAV} settingsHref="/admin/account" context="Platform administration">
      {children}
    </AppShell>
  );
}
