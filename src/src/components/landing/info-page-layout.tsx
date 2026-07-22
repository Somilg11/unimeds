import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';

interface InfoPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function InfoPageLayout({ children, title }: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingNav />

      <main className="pt-28 flex-1">
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
