import { AdminAppShell } from './admin-shell';

export const dynamic = 'force-dynamic';

export default function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAppShell>{children}</AdminAppShell>;
}
