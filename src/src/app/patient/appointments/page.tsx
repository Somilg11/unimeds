import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ListSkeleton } from '@/components/app/common';
import { AppointmentsList } from './appointments-list';

export const metadata: Metadata = { title: 'Appointments' };

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={5} />}>
      <AppointmentsList />
    </Suspense>
  );
}
