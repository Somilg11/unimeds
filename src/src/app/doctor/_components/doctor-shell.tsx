'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Building2, CalendarClock, CalendarDays, FileText, Loader2, Stethoscope, UserRound, Users } from 'lucide-react';
import { ApiError, errorMessage } from '@/lib/api';
import { AppShell, type NavItem } from '@/components/app/app-shell';
import { ErrorState } from '@/components/app/common';
import { Button } from '@/components/ui/button';
import { useDoctorClinics } from './hooks';

const NAV: NavItem[] = [
  { href: '/doctor', label: 'Today', icon: Stethoscope, exact: true },
  { href: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/doctor/patients', label: 'Patients', icon: Users },
  { href: '/doctor/records', label: 'Records', icon: FileText },
  { href: '/doctor/schedule', label: 'Schedule', icon: CalendarClock },
  { href: '/doctor/profile', label: 'Profile', icon: UserRound },
];

function NotActive() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
      <Building2 className="mb-3 size-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold">You&apos;re not active at any clinic yet</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Once a clinic admin invites you (or re-activates your membership), your appointments, patients and schedule will appear here. You can still
        update your profile in the meantime.
      </p>
      <Button variant="outline" className="mt-6" onClick={() => signOut({ redirectTo: '/login' })}>
        Sign out
      </Button>
    </div>
  );
}

export function DoctorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, error, isLoading, refetch } = useDoctorClinics();
  const inactive = error instanceof ApiError && error.status === 403;
  // Profile/security work without a clinic, so keep it reachable
  const onProfile = pathname.startsWith('/doctor/profile');

  const context = data?.items.length ? data.items.map((c) => c.name).join(' · ') : inactive ? 'No active clinic' : null;

  let body: React.ReactNode = children;
  if (!onProfile) {
    if (isLoading)
      body = (
        <div className="flex justify-center py-24 text-muted-foreground" aria-label="Loading">
          <Loader2 className="animate-spin" />
        </div>
      );
    else if (inactive) body = <NotActive />;
    else if (error) body = <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;
  }

  return (
    <AppShell nav={NAV} settingsHref="/doctor/profile" context={context}>
      {body}
    </AppShell>
  );
}
