import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PortalLandingLayoutProps {
  children: React.ReactNode;
  title: string;
  rightPanel?: React.ReactNode;
}

export function PortalLandingLayout({ children, title, rightPanel }: PortalLandingLayoutProps) {
  if (rightPanel) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row">
        <title>{title} - UniMeds</title>

        {/* Left side - form */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 lg:p-10 flex-1 flex flex-col">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors mb-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>

            <div className="flex-1 flex items-center justify-center">
              {children}
            </div>

            <p className="text-[11px] text-gray-400 mt-auto hidden lg:block">
              &copy; {new Date().getFullYear()} UniMeds. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right side - branding */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#36565F] via-[#2a4550] to-[#1e3440]">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
            {rightPanel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <title>{title} - UniMeds</title>
      <main className="pt-24 md:pt-28 flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
