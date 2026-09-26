'use client';

import { CalendarDays, FileText, House, Stethoscope, UserRound } from 'lucide-react';
import { AppShell, type NavItem } from '@/components/app/app-shell';

const NAV: NavItem[] = [
  { href: '/patient', label: 'Home', icon: House, exact: true, tab: true },
  { href: '/patient/book', label: 'Book', icon: Stethoscope, tab: true },
  { href: '/patient/appointments', label: 'Visits', icon: CalendarDays, tab: true },
  { href: '/patient/records', label: 'Records', icon: FileText, tab: true },
  { href: '/patient/profile', label: 'Profile', icon: UserRound },
];

export function PatientShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={NAV} settingsHref="/patient/profile" mobile="tabs" doctorSearch={(id) => `/patient/book?doctorId=${id}`}>
      {children}
    </AppShell>
  );
}
