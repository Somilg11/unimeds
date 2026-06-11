import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface ExtendedSession {
  accessToken?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export default async function AdminClinics() {
  const session = await auth() as ExtendedSession;
  
  if (!session?.user) {
    redirect('/admin');
  }

  // Fetch clinics from the backend via our API route
  let clinics = [];
  let loading = true;
  let error = null;

  try {
    const res = await fetch('/api/admin/clinics', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch clinics: ${res.status}`);
    }

    const resJson = await res.json();
    clinics = resJson.clinics || [];
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching clinics:', err);
  } finally {
    loading = false;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clinics</h1>
      {loading && <p>Loading clinics...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && clinics.length > 0 && (
        <div className="bg-white rounded-lg border border-zinc-200">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Created At</th>
                <th className="text-left p-3">Updated At</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((clinic: { id: string; name: string; createdAt: string; updatedAt: string }) => (
                <tr key={clinic.id} className="border-t">
                  <td className="p-3">{clinic.id}</td>
                  <td className="p-3">{clinic.name}</td>
                  <td className="p-3">{new Date(clinic.createdAt).toLocaleString()}</td>
                  <td className="p-3">{new Date(clinic.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && clinics.length === 0 && (
        <p>No clinics found.</p>
      )}
    </div>
  );
}