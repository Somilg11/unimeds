import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LandingFooter } from './landing-footer';

interface PortalLandingLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function PortalLandingLayout({ children, title }: PortalLandingLayoutProps) {
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

          <div className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-900">
            {title}
          </div>

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
              className="h-full px-6 flex items-center border-l border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/"
              className="h-full px-6 flex items-center gap-2 border-l border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
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
        {children}
      </main>

      <LandingFooter />
    </div>
  );
}
