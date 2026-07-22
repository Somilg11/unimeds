'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DoctorNav } from '@/app/doctor/_components/doctor-nav';

export function DoctorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState('Doctor');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('doctor_token');
    if (!token) {
      router.push('/doctor');
      return;
    }

    try {
      const userStr = localStorage.getItem('doctor_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserName(user.name || 'Doctor');
      }
    } catch {
      // ignore parse errors
    }

    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <DoctorNav userName={userName} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pt-13 lg:pt-0 p-4 lg:p-10 overflow-y-auto max-w-[1400px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
