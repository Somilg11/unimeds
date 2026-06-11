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

export default async function SuperAdminDashboard() {
  const session = await auth() as ExtendedSession;
  
  if (!session?.user) {
    redirect('/admin');
  }

  // Fetch platform metrics
  let metrics = null;
  let metricsLoading = true;
  let metricsError: string | null = null;

  // Fetch recent audit logs
  let auditLogs: Array<{ id: string; timestamp: string; metadata?: { userId?: string }; action: string; targetResource: string }> = [];
  let auditLogsLoading = true;
  let auditLogsError: string | null = null;

  // Fetch metrics
  try {
    const res = await fetch('/api/admin/metrics', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch metrics: ${res.status}`);
    }

    metrics = await res.json();
  } catch (err: unknown) {
    metricsError =
      err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching metrics:', err);
  } finally {
    metricsLoading = false;
  }

  // Fetch audit logs
  try {
    const res = await fetch('/api/admin/audit-logs?limit=5', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch audit logs: ${res.status}`);
    }

    const resJson = await res.json();
    auditLogs = resJson.logs || [];
  } catch (err: unknown) {
    auditLogsError =
      err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching audit logs:', err);
  } finally {
    auditLogsLoading = false;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Error */}
      {metricsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {metricsError}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Users */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Total Users
          </h2>
          <div className="text-3xl font-semibold text-zinc-900">
            {metricsLoading ? '...' : metrics?.metrics?.totalUsers ?? 0}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Across all clinics
          </div>
        </div>

        {/* Total Clinics */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Total Clinics
          </h2>
          <div className="text-3xl font-semibold text-zinc-900">
            {metricsLoading ? '...' : metrics?.metrics?.totalClinics ?? 0}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Active clinics
          </div>
        </div>

        {/* Total Appointments */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Total Appointments
          </h2>
          <div className="text-3xl font-semibold text-zinc-900">
            {metricsLoading
              ? '...'
              : metrics?.metrics?.totalAppointments ?? 0}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            All time
          </div>
        </div>

        {/* Total Records */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Total Records
          </h2>
          <div className="text-3xl font-semibold text-zinc-900">
            {metricsLoading ? '...' : metrics?.metrics?.totalRecords ?? 0}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Stored securely
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Recent Appointments
          </h2>
          <div className="text-3xl font-semibold text-zinc-900">
            {metricsLoading
              ? '...'
              : metrics?.metrics?.recentAppointments ?? 0}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Last 30 days
          </div>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Recent Audit Logs
        </h2>

        {auditLogsLoading ? (
          <p>Loading audit logs...</p>
        ) : auditLogsError ? (
          <p className="text-red-500">Error: {auditLogsError}</p>
        ) : auditLogs.length === 0 ? (
          <p>No audit logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-4 py-2 text-left text-zinc-600">
                    Timestamp
                  </th>
                  <th className="px-4 py-2 text-left text-zinc-600">
                    User
                  </th>
                  <th className="px-4 py-2 text-left text-zinc-600">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left text-zinc-600">
                    Resource
                  </th>
                </tr>
              </thead>

              <tbody>
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-zinc-100"
                  >
                    <td className="px-4 py-2 text-zinc-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="px-4 py-2 text-zinc-600">
                      {log.metadata?.userId
                        ? `User ID: ${log.metadata.userId}`
                        : 'N/A'}
                    </td>

                    <td className="px-4 py-2 text-zinc-600">
                      {log.action}
                    </td>

                    <td className="px-4 py-2 text-zinc-600">
                      {log.targetResource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}