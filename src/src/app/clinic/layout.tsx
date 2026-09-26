'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { BarChart3, CalendarDays, FileText, History, LayoutDashboard, Loader2, Settings, ShieldAlert, Users, UserRound } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { AppShell, type NavItem } from '@/components/app/app-shell';
import { Button } from '@/components/ui/button';
import { useClinic } from './_components/hooks';

const NAV: NavItem[] = [
  { href: '/clinic', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/clinic/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/clinic/team', label: 'Team', icon: Users },
  { href: '/clinic/patients', label: 'Patients', icon: UserRound },
  { href: '/clinic/records', label: 'Records', icon: FileText },
  { href: '/clinic/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/clinic/activity', label: 'Activity', icon: History },
  { href: '/clinic/settings', label: 'Settings', icon: Settings },
];

function ClinicInactive() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Your clinic isn&apos;t active</h1>
          <p className="text-sm text-muted-foreground">
            This clinic is currently suspended or hasn&apos;t been activated yet, or your admin access has been paused. Please contact Unimeds support
            to restore access.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/support">Contact support</Link>
          </Button>
          <Button onClick={() => signOut({ redirectTo: '/login' })}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  const { data: clinic, error, isLoading } = useClinic();

  if (error instanceof ApiError && error.status === 403) return <ClinicInactive />;
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground" role="status" aria-label="Loading">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <AppShell nav={NAV} settingsHref="/clinic/settings" context={clinic?.name}>
      {children}
    </AppShell>
  );
}
