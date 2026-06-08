import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RecordsClient } from '@/app/user/_components/records-client';

export default async function RecordsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/user');
  }

  return <RecordsClient userName={session.user.name || 'User'} />;
}
