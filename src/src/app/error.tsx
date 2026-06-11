'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-700 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          {error.digest && (
            <p className="text-xs text-red-600 mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <Button
            onClick={reset}
            variant="outline"
            className="w-full"
          >
            Try again
          </Button>
        </div>
        <p className="text-center text-sm text-zinc-500">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
