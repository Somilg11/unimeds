'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { ScrollText, RefreshCw, X, Eye, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  timestamp: string;
  metadata?: { [key: string]: unknown };
  action: string;
  targetResource: string;
}

function formatTargetShort(target: string): string {
  const parts = target.split(':');
  if (parts.length >= 2) {
    return parts[0].replace(/_/g, ' ');
  }
  return target;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function AdminAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [detailModal, setDetailModal] = useState<{ open: boolean; title: string; content: string }>({
    open: false,
    title: '',
    content: '',
  });

  const [clearModal, setClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/admin/audit-logs');
      const raw = res.data;
      const logsList = raw?.logs || raw?.data?.logs || raw?.data || raw || [];
      setAuditLogs(Array.isArray(logsList) ? logsList : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (auditLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['Timestamp', 'User', 'Action', 'Target', 'Metadata'];
    const rows = auditLogs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.userName || log.userEmail || 'System',
      log.action,
      log.targetResource,
      JSON.stringify(log.metadata || {}),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Audit logs exported');
  }

  async function handleClearLogs(olderThan?: number) {
    try {
      setClearing(true);
      const params = olderThan ? `?olderThan=${olderThan}` : '';
      await apiClient.delete(`/admin/audit-logs${params}`);
      toast.success(olderThan ? `Cleared logs older than ${olderThan} days` : 'Cleared all audit logs');
      setClearModal(false);
      fetchAuditLogs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clear logs';
      toast.error(message);
    } finally {
      setClearing(false);
    }
  }

  function openTargetDetail(target: string) {
    setDetailModal({ open: true, title: 'Target Resource', content: target });
  }

  function openMetadataDetail(metadata: unknown) {
    setDetailModal({ open: true, title: 'Metadata', content: JSON.stringify(metadata, null, 2) });
  }

  const totalPages = Math.max(1, Math.ceil(auditLogs.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLogs = auditLogs.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-6">Audit Logs</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
            Admin Portal
          </p>
          <div className="flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-gray-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={fetchAuditLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportCsv} variant="outline" size="sm" disabled={auditLogs.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setClearModal(true)} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" disabled={auditLogs.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
            Dismiss
          </button>
        </div>
      )}

      {auditLogs.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No audit logs found</p>
        </div>
      ) : (
        <div className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="border-b border-gray-200">
                  <th className="px-3 sm:px-4 py-3 text-left font-mono text-[10px] uppercase text-gray-500">
                    Timestamp
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left font-mono text-[10px] uppercase text-gray-500">
                    User
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left font-mono text-[10px] uppercase text-gray-500">
                    Action
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left font-mono text-[10px] uppercase text-gray-500">
                    Target
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left font-mono text-[10px] uppercase text-gray-500">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-gray-900 whitespace-nowrap text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-600 whitespace-nowrap">
                      {log.userName || log.userEmail || 'System'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-600 whitespace-nowrap">
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <button
                        onClick={() => openTargetDetail(log.targetResource)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {formatTargetShort(log.targetResource)}
                      </button>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <button
                        onClick={() => openMetadataDetail(log.metadata)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditLogs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
              <p className="text-xs text-gray-500">
                Page {safeCurrentPage} of {totalPages} ({auditLogs.length} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetailModal({ open: false, title: '', content: '' })}
          />
          <div className="relative bg-white border border-gray-200 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">{detailModal.title}</h3>
              <button
                onClick={() => setDetailModal({ open: false, title: '', content: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono">
                {detailModal.content}
              </pre>
            </div>
            <div className="px-4 py-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModal({ open: false, title: '', content: '' })}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Modal */}
      {clearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !clearing && setClearModal(false)}
          />
          <div className="relative bg-white border border-gray-200 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Clear Audit Logs</h3>
              <button
                onClick={() => !clearing && setClearModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">
                Choose what to clear. This action cannot be undone.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleClearLogs(30)}
                  disabled={clearing}
                  className="w-full text-left px-3 py-2.5 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-gray-900">Older than 30 days</p>
                  <p className="text-xs text-gray-500 mt-0.5">Keep recent logs, remove everything older</p>
                </button>
                <button
                  onClick={() => handleClearLogs(90)}
                  disabled={clearing}
                  className="w-full text-left px-3 py-2.5 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-gray-900">Older than 90 days</p>
                  <p className="text-xs text-gray-500 mt-0.5">Keep last 3 months, remove everything older</p>
                </button>
                <button
                  onClick={() => handleClearLogs()}
                  disabled={clearing}
                  className="w-full text-left px-3 py-2.5 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-red-700">Clear all logs</p>
                  <p className="text-xs text-red-500 mt-0.5">Delete every audit log permanently</p>
                </button>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearModal(false)}
                disabled={clearing}
                className="w-full"
              >
                {clearing ? 'Clearing...' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
