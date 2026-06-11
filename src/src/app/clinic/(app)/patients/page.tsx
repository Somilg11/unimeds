import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ClinicAdminPatients() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/clinic');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patients</h1>
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <p className="text-zinc-600">Patient management interface coming soon.</p>
        {/* TODO: Connect to backend to fetch and display patients */}
      </div>
    </div>
  );
}