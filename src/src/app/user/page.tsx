'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, FileHeart, Brain, Shield, Clock, ChevronRight } from 'lucide-react';
import { PortalLandingLayout } from '@/components/landing/portal-landing-layout';
import { signInPatient } from '@/app/auth/actions';

export default function PatientWelcome() {
  return (
    <PortalLandingLayout title="Patient Portal">
      {/* Hero */}
      <section>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[80vh] lg:min-h-[85vh]">
            {/* Left: 70% */}
            <div className="lg:col-span-7 flex flex-col justify-center py-16 lg:py-0 lg:pr-10 border-b lg:border-b-0 lg:border-r border-gray-200">
              <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-6">
                Patient Portal
              </p>
              <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-bold tracking-[-0.03em] leading-[0.95] text-gray-900 mb-8">
                Your health,
                <br />
                your timeline.
              </h1>
              <p className="text-base sm:text-lg text-gray-500 max-w-md leading-relaxed mb-10">
                Manage your health records, book appointments, and stay connected with your care team &mdash; all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <form action={signInPatient}>
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

            {/* Right: 30% preview */}
            <div className="lg:col-span-5 flex flex-col justify-center py-12 lg:py-0 lg:pl-10">
              <div className="border border-gray-200 divide-y divide-gray-200">
                <div className="p-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-900 rounded flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">JD</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">Jane Doe</p>
                    <p className="text-[11px] text-gray-400">Patient ID: PM-2024-8842</p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">Upcoming Appointment</p>
                      <p className="text-[11px] text-gray-400">Dr. Smith &middot; June 15, 2026</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileHeart className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">Medical Records</p>
                      <p className="text-[11px] text-gray-400">3 new documents</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">AI Health Insights</p>
                      <p className="text-[11px] text-gray-400">Personalized recommendations</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>

                <div className="px-5 py-3 flex items-center gap-2">
                  <Shield className="w-3 h-3 text-gray-300" />
                  <span className="text-[10px] text-gray-400">HIPAA Protected &middot; End-to-end encrypted</span>
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
              { icon: Calendar, title: 'Smart Booking', desc: 'Book appointments with your doctors in seconds. Automatic reminders keep you on track.' },
              { icon: FileHeart, title: 'Health Timeline', desc: 'Your complete health history in one place. Upload records, track medications, and more.' },
              { icon: Brain, title: 'AI-Assisted Insights', desc: 'Get personalized health recommendations powered by clinical AI models.' },
              { icon: Clock, title: 'Quick Access', desc: 'Access your records anytime, anywhere. Share with specialists with one tap.' },
              { icon: Shield, title: 'Private & Secure', desc: 'Your data is encrypted and never shared without your explicit consent.' },
              { icon: ArrowRight, title: 'Seamless Referrals', desc: 'Easy referral process when you need to see a specialist.' },
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
