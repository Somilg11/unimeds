'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield } from 'lucide-react';
import { PortalLandingLayout } from '@/components/landing/portal-landing-layout';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.replace('/admin/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalLandingLayout title="Super Admin">
      <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-apple border border-gray-100 p-8 sm:p-10 animate-subtle text-center">
        <img src="/unimeds_logo.png" alt="UniMeds" className="w-16 h-16 object-contain mx-auto mb-6" />
        
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 mb-2">Super Admin</h1>
        <p className="text-[14px] text-gray-500 mb-8 px-2">
          Sign in with your admin credentials to manage the platform.
        </p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600 text-center mb-4">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-gray-600 px-1">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all"
              autoFocus
            />
          </div>
          <div className="space-y-1.5 pb-2">
            <label className="text-[12px] font-medium text-gray-600 px-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full h-11 bg-primary text-white text-[14px] font-medium rounded-full shadow-apple hover-lift transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[11px] text-gray-500 font-medium">Restricted Access &middot; All Activity Logged</span>
          </div>
        </div>
      </div>
    </PortalLandingLayout>
  );
}
