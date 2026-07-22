'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClinicAdminNav } from './clinic-admin-nav';

export function ClinicAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
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
      setUserName(data?.clinic?.name || 'Clinic Admin');
      setChecking(false);
    } catch {
      router.push('/clinic');
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <ClinicAdminNav userName={userName} />
      <div className="flex-1 flex flex-col pt-13 lg:pt-0">
        <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
