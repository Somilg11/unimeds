import type { Metadata } from 'next';
import { PatientShell } from './_components/patient-shell';

export const metadata: Metadata = { title: 'Patient portal' };

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
