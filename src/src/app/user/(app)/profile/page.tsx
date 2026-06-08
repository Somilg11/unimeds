import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileClient } from '@/app/user/_components/profile-client';


export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/user');
  }

  return <ProfileClient userName={session.user.name || 'User'} email={session.user.email || ''} />;
}
