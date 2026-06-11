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
    <div className="flex min-h-screen bg-zinc-50">
      <UserNav userName={session.user.name || 'User'} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
