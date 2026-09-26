import type { Metadata } from 'next';
import { DoctorShell } from './_components/doctor-shell';

export const metadata: Metadata = { title: 'Doctor portal' };

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <DoctorShell>{children}</DoctorShell>;
}
