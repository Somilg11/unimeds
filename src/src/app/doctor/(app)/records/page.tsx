import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DoctorRecordsClient } from '@/app/doctor/_components/doctor-records-client';

export default async function DoctorRecordsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/doctor');
  }

  return <DoctorRecordsClient userName={session.user.name || 'Doctor'} />;
}
