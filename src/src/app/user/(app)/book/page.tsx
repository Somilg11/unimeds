import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation'; 
import { BookingClient } from '@/app/user/_components/booking-client';

export default async function BookingPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/user');
  }

  return <BookingClient userName={session.user.name || 'User'} />;
}
