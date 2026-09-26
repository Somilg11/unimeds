'use client';

import './globals.css';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-4 font-sans text-foreground antialiased">
        <title>Something went wrong · Unimeds</title>
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">
            Unimeds ran into an unexpected problem. Please try again in a moment.
          </p>
          {error.digest && <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
            {/* Plain anchor: a full reload is the safest recovery when the root layout failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
