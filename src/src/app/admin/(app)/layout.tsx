'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from './admin-nav';

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
      router.push('/admin');
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
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminNav userName={userName} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pt-13 lg:pt-0 p-4 lg:p-10 overflow-y-auto max-w-[1400px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
