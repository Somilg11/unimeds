import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LandingFooter } from './landing-footer';
import { LandingNav } from './landing-nav';

interface PortalLandingLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function PortalLandingLayout({ children, title }: PortalLandingLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingNav />

      <main className="pt-14 md:pt-24 flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {children}
      </main>

      <LandingFooter />
    </div>
  );
}
