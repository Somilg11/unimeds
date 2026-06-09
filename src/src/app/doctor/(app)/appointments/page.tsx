import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppointmentsClient } from '@/app/doctor/_components/appointments-client';

export default async function AppointmentsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/doctor');
  }

  return <AppointmentsClient userName={session.user.name || 'Doctor'} />;
}
