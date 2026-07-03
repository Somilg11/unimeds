'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInPatient, signInClinic } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Stethoscope, Building2, LayoutDashboard, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'patient' | 'doctor' | 'clinic' | 'admin';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeRole, setActiveRole] = useState<Role>('patient');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['patient', 'doctor', 'clinic', 'admin'].includes(roleParam)) {
      setActiveRole(roleParam as Role);
    }
  }, [searchParams]);

  // Doctor state
  const [doctorAuthId, setDoctorAuthId] = useState('');

  // Admin state
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear errors when switching tabs
  useEffect(() => {
    setError(null);
  }, [activeRole]);

  // Handle custom login (Doctor & Admin)
  async function handleCustomLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (activeRole === 'doctor') {
        if (!doctorAuthId.trim()) throw new Error('Auth ID is required');
        const res = await fetch('/api/doctor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authId: doctorAuthId.trim() }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Login failed');
        }
        const data = await res.json();
        localStorage.setItem('doctor_token', data.token);
        localStorage.setItem('doctor_user', JSON.stringify(data.user));
        router.push('/doctor/dashboard');

      } else if (activeRole === 'admin') {
        if (!adminUser.trim() || !adminPass.trim()) throw new Error('Username and Password are required');
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: adminUser, password: adminPass }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Login failed');
        }
        const data = await res.json();
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        router.push('/admin/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#d4e1f7] bg-white shadow-sm flex items-center justify-center bg-[#EBF0FE] mb-4">
          <img src="/unimeds_logo.png" alt="UniMeds Logo" className="h-8 w-8 object-contain" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#0B0A0A]">UniMeds</h1>
      </div>

      <Card className="w-full max-w-md border-border/50 shadow-lg animate-subtle rounded-3xl overflow-hidden bg-white">

        {/* Role Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
          {[
            { id: 'patient', label: 'Patient', icon: LayoutDashboard },
            { id: 'doctor', label: 'Doctor', icon: Stethoscope },
            { id: 'clinic', label: 'Clinic', icon: Building2 },
            { id: 'admin', label: 'Admin', icon: User }
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id as Role)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-4 px-2 text-xs font-semibold transition-all shrink-0",
                activeRole === role.id
                  ? "text-[#246AFE] bg-[#EBF0FE]/50 border-b-2 border-[#246AFE]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <role.icon className="w-4 h-4" />
              {role.label}
            </button>
          ))}
        </div>

        <CardHeader className="p-6 text-center pb-2">
          <CardTitle className="text-xl">
            {activeRole === 'patient' && 'Patient Portal'}
            {activeRole === 'doctor' && 'Doctor Dashboard'}
            {activeRole === 'clinic' && 'Clinic Administration'}
            {activeRole === 'admin' && 'Super Admin'}
          </CardTitle>
          <CardDescription className="text-xs">
            {activeRole === 'patient' && 'Manage your health records & appointments'}
            {activeRole === 'doctor' && 'Access clinical tools and patient records'}
            {activeRole === 'clinic' && 'Manage your clinic operations and staff'}
            {activeRole === 'admin' && 'Command center for UniMeds platform'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Patient Login */}
          {activeRole === 'patient' && (
            <form action={signInPatient}>
              <Button type="submit" className="w-full h-11 rounded-xl bg-[#0B0A0A] hover:bg-gray-800 text-white font-medium transition-colors">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>
            </form>
          )}

          {/* Clinic Login */}
          {activeRole === 'clinic' && (
            <form action={signInClinic}>
              <Button type="submit" className="w-full h-11 rounded-xl bg-[#246AFE] hover:bg-blue-600 text-white font-medium transition-colors">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>
            </form>
          )}

          {/* Doctor Login */}
          {activeRole === 'doctor' && (
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Auth ID</label>
                <input
                  type="text"
                  placeholder="Enter your auth ID"
                  value={doctorAuthId}
                  onChange={(e) => setDoctorAuthId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#246AFE] focus:bg-white transition-all"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading || !doctorAuthId.trim()} className="w-full h-11 rounded-xl bg-[#246AFE] hover:bg-blue-600 text-white font-medium transition-colors flex items-center justify-center gap-2">
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>
          )}

          {/* Admin Login */}
          {activeRole === 'admin' && (
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B0A0A] focus:bg-white transition-all"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B0A0A] focus:bg-white transition-all"
                />
              </div>
              <Button type="submit" disabled={loading || !adminUser.trim() || !adminPass.trim()} className="w-full h-11 rounded-xl bg-[#0B0A0A] hover:bg-gray-800 text-white font-medium transition-colors flex items-center justify-center gap-2">
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-[280px] mx-auto">
              By signing in, you agree to our Terms of Service and Privacy Policy. All access is strictly monitored and logged.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

import { LandingNav } from '@/components/landing/landing-nav';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LandingNav />
      <div className="pt-24 pb-12 flex items-center justify-center p-4">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
}
