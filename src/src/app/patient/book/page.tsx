import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ListSkeleton } from '@/components/app/common';
import { BookingWizard } from './booking-wizard';

export const metadata: Metadata = { title: 'Find care' };

export default function BookPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <BookingWizard />
    </Suspense>
  );
}
