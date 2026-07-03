'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { LayoutDashboard, Calendar, Users, FileText, Settings, BarChart3, UserCog } from 'lucide-react';

const clinicNavItems = [
  { href: '/clinic/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clinic/appointments', label: 'Appointments', icon: Calendar },
  { href: '/clinic/patients', label: 'Patients', icon: Users },
  { href: '/clinic/records', label: 'Records', icon: FileText },
  { href: '/clinic/settings', label: 'Settings', icon: Settings },
];

export default function ClinicAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/clinic-admin/settings');
      if (!res.ok) {
        router.push('/auth/signin?role=clinic');
        return;
      }
      const data = await res.json();
      setUserName(data?.clinic?.name || 'Clinic Admin');
      setChecking(false);
    } catch {
      router.push('/auth/signin?role=clinic');
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen bg-neutral-50 items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      navItems={clinicNavItems}
      userName={userName}
      roleLabel="Clinic Admin"
      logoutHref="/"
    >
      {children}
    </DashboardLayout>
  );
}
