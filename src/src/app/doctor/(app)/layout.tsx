'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Calendar, Users, LayoutDashboard, Clock, FileText } from 'lucide-react';

const doctorNavItems = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
  { href: '/doctor/availability', label: 'Availability', icon: Clock },
  { href: '/doctor/patients', label: 'Patients', icon: Users },
  { href: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
];

export default function DoctorAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('doctor_token');
    if (!token) {
      router.push('/auth/signin?role=doctor');
      return;
    }

    try {
      const userStr = localStorage.getItem('doctor_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Doctor');
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
      navItems={doctorNavItems}
      userName={userName || 'Doctor'}
      roleLabel="Doctor Portal"
      logoutHref="/"
    >
      {children}
    </DashboardLayout>
  );
}
