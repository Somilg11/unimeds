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
    <PortalLandingLayout
      title="Doctor Portal"
      rightPanel={
        <>
          <img src="/unimeds_logo.png" alt="UniMeds" className="w-14 h-14 object-contain mb-8 brightness-0 invert" />
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            Clinical Excellence,{' '}
            <span className="text-white/70">Streamlined.</span>
          </h2>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-sm text-center">
            Manage appointments, access patient records, and set your availability — all from one dashboard.
          </p>
        </>
      }
    >
      <div className="w-full max-w-[400px] text-left">
        {/* Mobile branding header */}
        <div className="lg:hidden mb-8 -mt-2">
          <img src="/unimeds_logo.png" alt="UniMeds" className="w-12 h-12 object-contain mb-4" />
          <h1 className="text-[24px] font-bold tracking-tight text-gray-900 mb-1">Doctor Portal</h1>
          <p className="text-[13px] text-gray-500">
            Sign in with your Auth ID to access clinical tools.
          </p>
        </div>

        {/* Desktop heading */}
        <div className="hidden lg:block">
          <h1 className="text-[26px] font-bold tracking-tight text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-[14px] text-gray-500 mb-8">
            Sign in with your Auth ID to access your dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">Auth ID</label>
            <input
              type="text"
              placeholder="Enter your Auth ID"
              value={authId}
              onChange={(e) => setAuthId(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#36565F]/30 focus:ring-4 focus:ring-[#36565F]/10 transition-all"
              autoFocus
            />
            <p className="text-[11px] text-gray-400 pt-0.5">
              Provided by your clinic administrator.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !authId.trim()}
            className="w-full h-12 bg-[#36565F] hover:bg-[#2a4550] text-white text-[14px] font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[12px] text-gray-600 font-medium">Encrypted &middot; HIPAA Compliant</span>
          </div>
        </div>
      </div>
    </PortalLandingLayout>
  );
}
