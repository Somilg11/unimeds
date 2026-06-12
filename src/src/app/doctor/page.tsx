'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Users, FileText, Calendar, Shield, Clock, Stethoscope } from 'lucide-react';
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
      {/* Hero */}
      <section>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[80vh] lg:min-h-[85vh]">
            {/* Left: 70% */}
            <div className="lg:col-span-7 flex flex-col justify-center py-16 lg:py-0 lg:pr-10 border-b lg:border-b-0 lg:border-r border-gray-200">
              <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-6">
                Doctor Dashboard
              </p>
              <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-bold tracking-[-0.03em] leading-[0.95] text-gray-900 mb-8">
                Clinical intelligence,
                <br />
                at your fingertips.
              </h1>
              <p className="text-base sm:text-lg text-gray-500 max-w-md leading-relaxed mb-10">
                Access patient records, manage appointments, and deliver better care with a dashboard designed for physicians.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[12px] text-gray-500">142 active patients</span>
                </div>
                <div className="w-px h-3 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-[12px] text-gray-500">Avg. 3 min per consult</span>
                </div>
              </div>
            </div>

            {/* Right: 30% login */}
            <div className="lg:col-span-5 flex flex-col justify-center py-12 lg:py-0 lg:pl-10">
              <div className="border border-gray-200">
                <div className="p-6 border-b border-gray-200 text-center">
                  <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mx-auto mb-3">
                    <Stethoscope className="w-5 h-5 text-gray-700" />
                  </div>
                  <h2 className="text-[15px] font-semibold text-gray-900">Doctor Portal</h2>
                  <p className="text-[12px] text-gray-400 mt-1">Sign in with your credentials</p>
                </div>

                <form onSubmit={handleLogin} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-600">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-600">Auth ID</label>
                    <input
                      type="text"
                      placeholder="Enter your auth ID"
                      value={authId}
                      onChange={(e) => setAuthId(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                      autoFocus
                    />
                    <p className="text-[11px] text-gray-400">
                      This is the identifier provided by your clinic administrator.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !authId.trim()}
                    className="w-full h-10 bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                    {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </form>

                <div className="px-6 py-3 border-t border-gray-200 flex items-center gap-2">
                  <Shield className="w-3 h-3 text-gray-300" />
                  <span className="text-[10px] text-gray-400">Encrypted &middot; HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
            {[
              { icon: Users, title: 'Patient Context', desc: 'Complete patient history, past diagnoses, and treatment plans at a glance.' },
              { icon: Calendar, title: 'Appointment Management', desc: 'View and manage your daily schedule with smart conflict detection.' },
              { icon: FileText, title: 'Clinical Records', desc: 'Access and update patient records with an intuitive clinical interface.' },
              { icon: Shield, title: 'Secure Access', desc: 'Role-based access controls ensure you only see what you need to.' },
              { icon: Clock, title: 'Time Efficient', desc: 'Streamlined workflows designed to minimize administrative burden.' },
              { icon: Stethoscope, title: 'Multi-clinic', desc: 'Manage patients across multiple practice locations seamlessly.' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-6 hover:bg-gray-50 transition-colors">
                <feature.icon className="w-4 h-4 text-blue-600 mb-3" />
                <h3 className="text-[13px] font-semibold text-gray-900 mb-1.5">{feature.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PortalLandingLayout>
  );
}
