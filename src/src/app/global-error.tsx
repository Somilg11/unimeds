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
        <main className="w-full max-w-md rounded-[2rem] bg-card px-6 py-12 text-center sm:px-10">
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-sm text-muted-foreground">Unimeds ran into an unexpected problem. Please try again in a moment.</p>
          {error.digest && <p className="mt-4 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="h-12 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              Try again
            </button>
            {/* Plain anchor: a full reload is the safest recovery when the root layout failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full border px-6 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
