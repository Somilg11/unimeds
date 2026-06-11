import { auth } from '@/lib/auth';
import { ClinicAdminNav } from './clinic-admin-nav';

export default async function ClinicAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userName = session?.user?.name || '';

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <ClinicAdminNav userName={userName} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}