import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserNav } from '@/app/user/_components/user-nav';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/user');
  }

  return (
    <div className="flex min-h-screen">
      <UserNav userName={session.user.name || 'User'} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
