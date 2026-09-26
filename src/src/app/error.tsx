'use client';

import { useEffect } from 'react';
import Link from 'next/link';
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
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We hit an unexpected problem loading this page. Please try again — if it keeps happening, contact support.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/support">Contact support</Link>
        </Button>
      </div>
    </div>
  );
}
