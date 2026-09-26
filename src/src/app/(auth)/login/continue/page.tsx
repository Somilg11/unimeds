import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { safeNext } from '@/lib/roles';

// Landing point after Google sign-in, once the role is known
export default async function ContinuePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await auth();
  if (!session?.user?.role) redirect('/login?error=google');
  const { next } = await searchParams;
  redirect(safeNext(next, session.user.role));
}
