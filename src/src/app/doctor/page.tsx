'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield } from 'lucide-react';
import { PortalLandingLayout } from '@/components/landing/portal-landing-layout';

export default function DoctorLoginPage() {
  const router = useRouter();
  const [authId, setAuthId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('doctor_token');
    if (token) {
      router.push('/doctor/dashboard');
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!authId.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId: authId.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('doctor_token', data.token);
      localStorage.setItem('doctor_user', JSON.stringify(data.user));
      router.push('/doctor/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalLandingLayout title="Doctor Dashboard">
      <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-apple border border-gray-100 p-8 sm:p-10 animate-subtle text-center">
        <img src="/unimeds_logo.png" alt="UniMeds" className="w-16 h-16 object-contain mx-auto mb-6" />
        
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 mb-2">Doctor Portal</h1>
        <p className="text-[14px] text-gray-500 mb-8 px-2">
          Sign in with your Auth ID to access clinical tools.
        </p>

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600 text-center mb-4">
              {error}
            </div>
          )}
          <div className="space-y-1.5 pb-2">
            <label className="text-[12px] font-medium text-gray-600 px-1">Auth ID</label>
            <input
              type="text"
              placeholder="Enter your Auth ID"
              value={authId}
              onChange={(e) => setAuthId(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all"
              autoFocus
            />
            <p className="text-[11px] text-gray-400 px-1 pt-1">
              Provided by your clinic administrator.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !authId.trim()}
            className="w-full h-11 bg-primary text-white text-[14px] font-medium rounded-full shadow-apple hover-lift transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Shield className="w-3 h-3 text-green-600" />
            <span className="text-[11px] text-gray-500 font-medium">Encrypted &middot; HIPAA Compliant</span>
          </div>
        </div>
      </div>
    </PortalLandingLayout>
  );
}
