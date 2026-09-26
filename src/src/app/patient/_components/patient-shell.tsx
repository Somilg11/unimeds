'use client';

import { CalendarDays, FileText, LayoutDashboard, Stethoscope, UserRound } from 'lucide-react';
import { AppShell, type NavItem } from '@/components/app/app-shell';

const NAV: NavItem[] = [
  { href: '/patient', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/patient/book', label: 'Find care', icon: Stethoscope },
  { href: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/patient/records', label: 'Records', icon: FileText },
  { href: '/patient/profile', label: 'Profile', icon: UserRound },
];

export function PatientShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={NAV} settingsHref="/patient/profile">
      {children}
    </AppShell>
  );
}
