'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClinicAdminNav } from './clinic-admin-nav';

export default function ClinicAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user has a valid session by trying to fetch clinic data
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/clinic-admin/settings');
      if (!res.ok) {
        router.push('/clinic');
        return;
      }
      const data = await res.json();
      // If we get here, the user is authenticated and the clinic is active
      setUserName(data?.clinic?.name || 'Clinic Admin');
      setChecking(false);
    } catch {
      router.push('/clinic');
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen bg-zinc-50 items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <ClinicAdminNav userName={userName} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
