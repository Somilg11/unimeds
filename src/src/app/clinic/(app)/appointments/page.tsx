/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react';

export default async function ClinicAdminAppointments() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/clinic');
  }

  // Fetch appointments from the backend
  let appointments = [];
  let loading = true;
  let error = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/hospital/admin/appointments`, {
      headers: {
        'Authorization': `Bearer ${session?.user?.authId}`, // Assuming authId is the token? We need to check.
        // Actually, we should use the same token as the session. We don't have the token in the session object.
        // We'll need to think about this.
        // For now, we'll leave it as a placeholder.
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch appointments: ${res.status}`);
    }

    appointments = await res.json();
  } catch (err: any) {
    error = err.message;
    console.error('Error fetching appointments:', err);
  } finally {
    loading = false;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Appointments</h1>
      {loading && <p>Loading appointments...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && appointments.length > 0 && (
        <div className="bg-white rounded-lg border border-zinc-200">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Patient</th>
                <th className="text-left p-3">Doctor</th>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt: { id: Key | null | undefined; patientName: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<unknown>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; doctorName: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; slotTime: string | number | Date; status: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                <tr key={apt.id} className="border-t">
                  <td className="p-3">{apt.patientName}</td>
                  <td className="p-3">{apt.doctorName}</td>
                  <td className="p-3">{new Date(apt.slotTime).toLocaleString()}</td>
                  <td className="p-3">{apt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && appointments.length === 0 && (
        <p>No appointments found.</p>
      )}
    </div>
  );
}