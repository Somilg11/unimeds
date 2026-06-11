'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DoctorRecordsClient } from '@/app/doctor/_components/doctor-records-client';

export default function DoctorRecordsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('Doctor');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('doctor_token');
    if (!storedToken) {
      router.push('/doctor');
      return;
    }
    setToken(storedToken);
    try {
      const userStr = localStorage.getItem('doctor_user');
      if (userStr) {
        setUserName(JSON.parse(userStr).name || 'Doctor');
      }
    } catch { /* ignore */ }
    setChecking(false);
  }, [router]);

  if (checking || !token) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return <DoctorRecordsClient userName={userName} token={token} />;
}
