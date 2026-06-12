'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Users, Settings, Calendar, Shield, Building2, FileText } from 'lucide-react';
import { PortalLandingLayout } from '@/components/landing/portal-landing-layout';
import { signInClinic } from '@/app/auth/actions';

export default function ClinicWelcome() {
  return (
    <PortalLandingLayout title="Clinic Admin">
      {/* Hero */}
      <section>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[80vh] lg:min-h-[85vh]">
            {/* Left: 70% */}
            <div className="lg:col-span-7 flex flex-col justify-center py-16 lg:py-0 lg:pr-10 border-b lg:border-b-0 lg:border-r border-gray-200">
              <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-6">
                Clinic Administration
              </p>
              <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-bold tracking-[-0.03em] leading-[0.95] text-gray-900 mb-8">
                Run your clinic,
                <br />
                effortlessly.
              </h1>
              <p className="text-base sm:text-lg text-gray-500 max-w-md leading-relaxed mb-10">
                Manage appointments, patients, staff, and analytics from a single powerful dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <form action={signInClinic}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </button>
                </form>
              </div>
              <p className="mt-4 text-[11px] text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>

            {/* Right: 30% dashboard preview */}
            <div className="lg:col-span-5 flex flex-col justify-center py-12 lg:py-0 lg:pl-10">
              <div className="border border-gray-200">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">Clinic Overview</p>
                    <p className="text-[11px] text-gray-400">Today&apos;s Summary</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">
                  <div className="p-4">
                    <p className="text-xl font-bold text-gray-900">24</p>
                    <p className="text-[10px] font-mono uppercase text-gray-400 mt-0.5">Appointments</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xl font-bold text-gray-900">8</p>
                    <p className="text-[10px] font-mono uppercase text-gray-400 mt-0.5">Pending</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xl font-bold text-gray-900">156</p>
                    <p className="text-[10px] font-mono uppercase text-gray-400 mt-0.5">Patients</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xl font-bold text-gray-900">6</p>
                    <p className="text-[10px] font-mono uppercase text-gray-400 mt-0.5">Staff</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {[
                    { label: 'Patient Queue', value: '12 waiting', color: 'text-blue-600' },
                    { label: 'Records Review', value: '3 urgent', color: 'text-amber-600' },
                    { label: 'Staff On Duty', value: '6 of 8', color: 'text-green-600' },
                  ].map((item) => (
                    <div key={item.label} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-[12px] text-gray-500">{item.label}</span>
                      <span className={`text-[12px] font-medium ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
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
              { icon: BarChart3, title: 'Real-time Analytics', desc: 'Live dashboards with patient flow, revenue metrics, and operational insights.' },
              { icon: Users, title: 'Patient Management', desc: 'Track every patient from intake to follow-up with complete visibility.' },
              { icon: Settings, title: 'Staff Management', desc: 'Manage schedules, roles, and permissions for your entire team.' },
              { icon: Calendar, title: 'Appointment Queue', desc: 'Smart queue management with automated scheduling and conflict resolution.' },
              { icon: FileText, title: 'Records & Reports', desc: 'Generate compliance reports, export data, and manage documentation.' },
              { icon: Shield, title: 'Access Control', desc: 'Granular role-based permissions for doctors, nurses, and administrative staff.' },
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
