'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface AuditLog {
  id: string;
  timestamp: string;
  metadata?: { userId?: string };
  action: string;
  targetResource: string;
}

interface ExtendedSession {
  data?: {
    accessToken?: string;
    user?: {
      id: string;
      name?: string;
      email?: string;
    };
  };
}

// react-compiler-exempt
export default function AdminAuditLogs() {
  const session = useSession() as ExtendedSession;
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const pendingFetchRef = useRef(false);

  const fetchAuditLogs = async () => {
    const token = session?.data?.accessToken;
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit-logs?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch audit logs: ${res.status}`);
      }

      const resJson = await res.json();
      setAuditLogs(resJson.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount - use setTimeout to avoid synchronous setState warning
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAuditLogs();
    }, 0);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pendingFetchRef.current) {
      fetchAuditLogs();
      pendingFetchRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, limit]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <Button
          onClick={() => {
            setOffset(0);
            fetchAuditLogs();
          }}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>
      {loading && <p>Loading audit logs...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && auditLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-zinc-200">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Timestamp</th>
                <th className="text-left p-3">User ID</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Target Resource</th>
                <th className="text-left p-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="p-3">{log.id}</td>
                  <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3">{log.metadata?.userId ?? 'N/A'}</td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3">{log.targetResource}</td>
                  <td className="p-3 text-xs">{JSON.stringify(log.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center p-4">
            <Button
              onClick={() => {
                setOffset(Math.max(0, offset - limit));
                pendingFetchRef.current = true;
              }}
              variant="outline"
              size="sm"
              disabled={offset === 0}
            >
              Previous
            </Button>
            <span>
              Showing {offset + 1} - {offset + auditLogs.length} of {auditLogs.length + offset} logs
            </span>
            <Button
              onClick={() => {
                setOffset(offset + limit);
                pendingFetchRef.current = true;
              }}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {!loading && !error && auditLogs.length === 0 && (
        <p>No audit logs found.</p>
      )}
    </div>
  );
}