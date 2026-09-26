'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-background px-4 py-16">
      <div role="alert" className="flex w-full max-w-lg flex-col items-center rounded-[2rem] bg-card px-6 py-12 text-center sm:px-10">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">Something went wrong</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          We hit an unexpected problem loading this page. Please try again — if it keeps happening, contact support.
        </p>
        {error.digest && <p className="mt-4 rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
        <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button size="lg" className="h-12 px-6" onClick={() => unstable_retry()}>
            Try again
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="h-12 px-6">
            <Link href="/support">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
