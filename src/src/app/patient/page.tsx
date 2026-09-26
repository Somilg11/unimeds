import type { Metadata } from 'next';
import { PatientOverview } from './_components/overview';

export const metadata: Metadata = { title: 'Overview' };

export default function PatientHomePage() {
  return <PatientOverview />;
}
