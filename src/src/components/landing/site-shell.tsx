import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

/**
 * Public-site chrome. The white pill nav is always rendered in the same sticky slot;
 * with `hero`, a solid blue rounded block sits underneath it.
 */
export function SiteShell({ children, hero }: { children: React.ReactNode; hero?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      {/* One nav position for every page, so it never shifts between routes.
          Wrapper height: 8+8+56 = 72px (sm: 12+16+56 = 84px). */}
      <div className="sticky top-0 z-50 px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="mx-auto max-w-6xl px-2 pt-2 sm:px-4 sm:pt-4">
          <LandingNav />
        </div>
      </div>
      {hero && (
        // The blue block slides up under the nav instead of wrapping it
        <div className="-mt-[72px] px-2 pt-2 sm:-mt-[84px] sm:px-3 sm:pt-3">
          <div className="rounded-[2rem] bg-brand pt-16 text-brand-foreground sm:pt-[4.5rem]">{hero}</div>
        </div>
      )}
      <main id="main" className="flex-1">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}

/** Standard page container for public pages. */
export function PageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14 ${className}`}>{children}</div>;
}
