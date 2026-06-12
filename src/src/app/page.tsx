import Link from 'next/link';
import { ArrowRight, User, Stethoscope, Building2, Shield, Activity, FileHeart, Calendar, Lock, Globe } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />

      {/* Hero Section */}
      <section className="pt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[80vh] lg:min-h-[85vh]">
            {/* Left: 70% headline */}
            <div className="lg:col-span-7 flex flex-col justify-center py-16 lg:py-0 lg:pr-10 border-b lg:border-b-0 lg:border-r border-gray-200">
              <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-6">
                Healthcare Platform
              </p>
              <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold tracking-[-0.03em] leading-[0.95] text-gray-900 mb-8">
                Healthcare,
                <br />
                reimagined.
              </h1>
              <p className="text-base sm:text-lg text-gray-500 max-w-md leading-relaxed mb-10">
                Streamline patient care, appointments, and medical records. Built for healthcare teams that move fast.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/user"
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded transition-colors"
                >
                  Enter Patient Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/doctor"
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 text-[13px] font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Doctor Dashboard
                </Link>
              </div>
            </div>

            {/* Right: 30% info panel */}
            <div className="lg:col-span-5 flex flex-col justify-center py-12 lg:py-0 lg:pl-10">
              <p className="text-sm text-gray-600 leading-relaxed mb-8">
                The platform modern clinics actually need. Manage appointments, patient records, and analytics — all in one place.
              </p>
              <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                <div className="bg-white p-5">
                  <Activity className="w-4 h-4 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">12k+</p>
                  <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Active Patients</p>
                </div>
                <div className="bg-white p-5">
                  <Calendar className="w-4 h-4 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">840</p>
                  <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Daily Bookings</p>
                </div>
                <div className="bg-white p-5">
                  <FileHeart className="w-4 h-4 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">45k</p>
                  <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Records</p>
                </div>
                <div className="bg-white p-5">
                  <Globe className="w-4 h-4 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">98.7%</p>
                  <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Patient Portal */}
            <Link href="/user" className="group block p-8 lg:p-10 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-8">
                <div className="w-10 h-10 border border-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-700" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">Patient Portal</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Your health, your timeline.</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Manage your health records, book appointments, and stay connected with your care team.
              </p>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <span className="text-[12px] text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Sign in with Google &rarr;
                </span>
              </div>
            </Link>

            {/* Doctor Dashboard */}
            <Link href="/doctor" className="group block p-8 lg:p-10 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-8">
                <div className="w-10 h-10 border border-gray-200 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-gray-700" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">Doctor Dashboard</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Clinical intelligence, at your fingertips.</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Access patient records, manage appointments, and deliver better care.
              </p>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <span className="text-[12px] text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Sign in with Auth ID &rarr;
                </span>
              </div>
            </Link>

            {/* Clinic Admin */}
            <Link href="/clinic" className="group block p-8 lg:p-10 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-8">
                <div className="w-10 h-10 border border-gray-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gray-700" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">Clinic Admin</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Run your clinic, effortlessly.</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Monitor analytics, appointment queues, and manage your entire clinic operation.
              </p>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <span className="text-[12px] text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Sign in with Google &rarr;
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-3">Why UniMeds</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
                Everything you need.
                <br />
                Nothing you don&apos;t.
              </h2>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
              {[
                { icon: Shield, title: 'HIPAA Compliant', desc: 'Enterprise-grade security with end-to-end encryption for all patient data.' },
                { icon: Activity, title: 'Real-time Analytics', desc: 'Live dashboards with actionable insights for better decision making.' },
                { icon: FileHeart, title: 'Smart Records', desc: 'AI-assisted medical record management with intelligent categorization.' },
                { icon: Calendar, title: 'Smart Scheduling', desc: 'Intelligent appointment booking with conflict detection and reminders.' },
                { icon: Lock, title: 'Private & Secure', desc: 'Your data is encrypted and never shared without your explicit consent.' },
                { icon: Globe, title: 'Multi-tenant', desc: 'Seamlessly manage multiple clinics and providers from a single platform.' },
              ].map((feature) => (
                <div key={feature.title} className="bg-white p-6 hover:bg-gray-50 transition-colors">
                  <feature.icon className="w-4 h-4 text-blue-600 mb-3" />
                  <h3 className="text-[13px] font-semibold text-gray-900 mb-1.5">{feature.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-gray-900">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase text-gray-500 tracking-wider mb-4">Get Started</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
              Ready to get started?
            </h2>
            <p className="text-base text-gray-400 mb-8">
              Join healthcare teams already using UniMeds to deliver better care.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/user"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-[13px] font-medium text-gray-900 bg-white hover:bg-gray-100 rounded transition-colors"
              >
                Enter Platform
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/clinic"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-[13px] font-medium text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
              >
                Explore as Clinic Admin
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
