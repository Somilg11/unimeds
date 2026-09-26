import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, LifeBuoy, LogIn, Search, Stethoscope } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

const DESTINATIONS = [
  { href: '/doctors', icon: Stethoscope, title: 'Find a doctor', body: 'Search by name, specialty or city.' },
  { href: '/clinics', icon: Building2, title: 'Browse clinics', body: 'See clinics and who practises there.' },
  { href: '/login', icon: LogIn, title: 'Your account', body: 'Appointments, records and your dashboard.' },
  { href: '/support', icon: LifeBuoy, title: 'Help centre', body: 'Answers about booking and accounts.' },
];

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-24">
        <section className="space-y-6">
          <p className="text-[5.5rem] leading-none font-bold tracking-tighter text-primary tabular-nums sm:text-[8rem]" aria-hidden>
            404
          </p>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">This page isn&apos;t here</h1>
            <p className="max-w-md text-muted-foreground">
              The link may be out of date, or the doctor or clinic may no longer be listed. Try searching, or pick one of the places on the right.
            </p>
          </div>

          {/* Plain GET form: works without JavaScript */}
          <form action="/doctors" method="get" role="search" className="flex max-w-md gap-2">
            <label htmlFor="nf-search" className="sr-only">
              Search doctors
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="nf-search"
                name="q"
                placeholder="Doctor or specialty"
                className="h-12 w-full rounded-full bg-card pr-4 pl-11 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6">
              Search
            </Button>
          </form>

          <Button asChild variant="link" className="px-0">
            <Link href="/">
              Back to home <ArrowRight />
            </Link>
          </Button>
        </section>

        <nav aria-label="Popular destinations" className="grid gap-3 sm:grid-cols-2">
          {DESTINATIONS.map(({ href, icon: Icon, title, body }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-4 rounded-3xl bg-card p-5 transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors group-hover:bg-card">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="flex items-center gap-1 font-semibold">
                  {title}
                  <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{body}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </SiteShell>
  );
}
