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
    <div className="flex min-h-screen bg-white">
      <UserNav userName={session.user.name || 'User'} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 pt-19 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
