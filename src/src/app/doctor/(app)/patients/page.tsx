import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PatientsClient } from '@/app/doctor/_components/patients-client';

export default async function PatientsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/doctor');
  }

  return <PatientsClient userName={session.user.name || 'Doctor'} />;
}
