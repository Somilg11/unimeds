import { DoctorShell } from './doctor-shell';

export const dynamic = 'force-dynamic';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DoctorShell>{children}</DoctorShell>;
}
