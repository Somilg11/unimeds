import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated: string;
}

export function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingNav />

      <main className="pt-24 flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
          <p className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider mb-4">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
            {title}
          </h1>
          <p className="text-[13px] text-neutral-400 mb-12">
            Last updated: {lastUpdated}
          </p>
          <div className="prose prose-neutral prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-neutral-900 [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-[14px] [&_p]:text-neutral-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-[14px] [&_ul]:text-neutral-600 [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:leading-relaxed">
            {children}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
