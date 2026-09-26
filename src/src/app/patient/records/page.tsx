import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ListSkeleton } from '@/components/app/common';
import { RecordsClient } from './records-client';

export const metadata: Metadata = { title: 'Records' };

export default function RecordsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <RecordsClient />
    </Suspense>
  );
}
