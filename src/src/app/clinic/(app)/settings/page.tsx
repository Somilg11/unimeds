import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ClinicAdminSettings() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/clinic');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clinic Settings</h1>
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <p className="text-zinc-600">Settings management interface coming soon.</p>
        {/* TODO: Connect to backend to update clinic settings */}
      </div>
    </div>
  );
}