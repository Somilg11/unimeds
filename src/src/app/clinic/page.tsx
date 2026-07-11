'use client';

import { Shield } from 'lucide-react';
import { PortalLandingLayout } from '@/components/landing/portal-landing-layout';
import { signInClinic } from '@/app/auth/actions';

export default function ClinicWelcome() {
  return (
    <PortalLandingLayout
      title="Clinic Portal"
      rightPanel={
        <>
          <img src="/unimeds_logo.png" alt="UniMeds" className="w-14 h-14 object-contain mb-8 brightness-0 invert" />
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            Run Your Clinic,{' '}
            <span className="text-white/70">Effortlessly.</span>
          </h2>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-sm text-center">
            Manage appointments, patients, and staff from a single powerful dashboard built for modern clinics.
          </p>
        </>
      }
    >
      <div className="w-full max-w-[400px] text-left">
        {/* Mobile branding header */}
        <div className="lg:hidden mb-8 -mt-2">
          <img src="/unimeds_logo.png" alt="UniMeds" className="w-12 h-12 object-contain mb-4" />
          <h1 className="text-[24px] font-bold tracking-tight text-gray-900 mb-1">Clinic Portal</h1>
          <p className="text-[13px] text-gray-500">
            Manage appointments, patients, and staff from one dashboard.
          </p>
        </div>

        {/* Desktop heading */}
        <div className="hidden lg:block">
          <h1 className="text-[26px] font-bold tracking-tight text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-[14px] text-gray-500 mb-8">
            Sign in to manage your clinic dashboard.
          </p>
        </div>

        <form action={signInClinic}>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2.5 h-12 px-6 text-[14px] font-medium text-white bg-[#36565F] hover:bg-[#2a4550] rounded-xl shadow-sm transition-all"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[12px] text-gray-600 font-medium">Verified Clinics Only</span>
          </div>
          <p className="text-[11px] text-gray-400">
            By signing in, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </PortalLandingLayout>
  );
}
