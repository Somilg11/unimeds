import { ClinicAdminShell } from './clinic-shell';

export const dynamic = 'force-dynamic';

export default function ClinicAdminLayout({ children }: { children: React.ReactNode }) {
  return <ClinicAdminShell>{children}</ClinicAdminShell>;
}
