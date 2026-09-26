import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

/** Public-site chrome: nav + content + footer. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
