import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/landing/site-shell';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-muted-foreground">The link may be out of date, or the doctor or clinic may no longer be listed.</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/doctors">Find a doctor</Link>
          </Button>
        </div>
      </div>
    </SiteShell>
  );
}
