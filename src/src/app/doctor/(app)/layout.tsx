import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DoctorNav } from '@/app/doctor/_components/doctor-nav';

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/doctor');
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <DoctorNav userName={session.user.name || 'Doctor'} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}