import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { LandingFooter } from '@/components/landing/landing-footer';

interface InfoPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function InfoPageLayout({ children, title }: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        {/* Desktop */}
        <div className="hidden md:flex h-13 items-center">
          <Link
            href="/"
            className="h-13 w-14 border-r border-neutral-200 flex items-center justify-center shrink-0"
          >
            <div className="w-7 h-7 bg-neutral-900 flex items-center justify-center m-1 border-2 border-neutral-900">
              <span className="text-white text-xs font-bold">U</span>
            </div>
          </Link>

          <nav className="flex h-full">
            <Link
              href="/user"
              className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              Patients
            </Link>
            <Link
              href="/doctor"
              className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              Doctors
            </Link>
            <Link
              href="/clinic"
              className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              Clinics
            </Link>
            <Link
              href="/admin"
              className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              Admin
            </Link>
          </nav>

          <div className="flex-1" />

          <div className="flex h-full">
            <Link
              href="/support"
              className="h-full px-6 flex items-center border-l border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              Support
            </Link>
            <Link
              href="/contact"
              className="h-full px-6 flex items-center bg-neutral-950 text-white text-[15px] font-medium hover:bg-black transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex h-13 items-center justify-between px-4">
          <Link href="/" className="w-8 h-8 bg-neutral-900 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">U</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/support"
              className="text-[13px] text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Support
            </Link>
            <Link
              href="/contact"
              className="text-[13px] text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1 text-[13px] text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-13 flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
          <p className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider mb-4">
            {title}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-12">
            {title}
          </h1>
          {children}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
