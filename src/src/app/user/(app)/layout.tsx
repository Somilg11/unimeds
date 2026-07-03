import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { FileText, Calendar, User, LayoutDashboard, ClipboardList } from 'lucide-react';

const userNavItems = [
  { href: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/user/records', label: 'Records', icon: FileText },
  { href: '/user/medical-history', label: 'History', icon: ClipboardList },
  { href: '/user/book', label: 'Book', icon: Calendar },
  { href: '/user/profile', label: 'Profile', icon: User },
];

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin?role=patient');
  }

  return (
    <DashboardLayout
      navItems={userNavItems}
      userName={session.user.name || 'Patient'}
      roleLabel="Patient Portal"
      logoutHref="/"
    >
      {children}
    </DashboardLayout>
  );
}
