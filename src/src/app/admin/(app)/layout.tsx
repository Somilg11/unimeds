'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { LayoutDashboard, Building2, Users, ScrollText, Settings } from 'lucide-react';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clinics', label: 'Clinics', icon: Building2 },
  { href: '/admin/doctors', label: 'Doctors', icon: Users },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState('Super Admin');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/auth/signin?role=admin');
      return;
    }

    try {
      const userStr = localStorage.getItem('admin_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Super Admin');
      }
    } catch { /* ignore */ }

    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen bg-neutral-50 items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      navItems={adminNavItems}
      userName={userName}
      roleLabel="Super Admin"
      logoutHref="/"
    >
      {children}
    </DashboardLayout>
  );
}
