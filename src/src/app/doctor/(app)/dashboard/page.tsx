import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DoctorDashboardClient } from '@/app/doctor/_components/doctor-dashboard-client';

export default async function DoctorDashboard() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/doctor');
  }

  return <DoctorDashboardClient userName={session.user.name || 'Doctor'} />;
}