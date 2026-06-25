import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MedicalHistoryClient } from '@/app/user/_components/medical-history-client';

export default async function MedicalHistoryPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/user');
  }

  return <MedicalHistoryClient userName={session.user.name || 'User'} />;
}
