'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollText, RefreshCw, X, Eye, ChevronLeft, ChevronRight, Download, Trash2, AlertTriangle } from 'lucide-react';
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
  const [olderThan, setOlderThan] = useState('');

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
          <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[12px] font-medium uppercase text-gray-500 tracking-wider mb-2">
            Admin Portal
          </p>
          <div className="flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-gray-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={fetchAuditLogs} variant="outline" className="rounded-xl h-10 px-4 text-[13px] font-medium border-gray-200 hover:bg-white shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportCsv} variant="outline" disabled={auditLogs.length === 0} className="rounded-xl h-10 px-4 text-[13px] font-medium border-gray-200 hover:bg-white shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setClearModal(true)} variant="outline" disabled={auditLogs.length === 0} className="rounded-xl h-10 px-4 text-[13px] font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shadow-sm">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50 m-4">
            <ScrollText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-[15px] font-semibold text-gray-900 mb-1">No audit logs found</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-gray-900 whitespace-nowrap text-[13px] font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap text-[13px]">
                      {log.userName || log.userEmail || 'System'}
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      <span className="text-[11px] font-mono font-medium bg-gray-100/80 text-gray-600 px-2.5 py-1 rounded-md">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openTargetDetail(log.targetResource)}
                        className="text-[13px] text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                      >
                        {formatTargetShort(log.targetResource)}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openMetadataDetail(log.metadata)}
                        className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditLogs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100/80 bg-gray-50/30 gap-4">
              <p className="text-[13px] text-gray-500 font-medium">
                Page {safeCurrentPage} of {totalPages} <span className="text-gray-400">({auditLogs.length} total)</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-xl text-[13px] font-medium border-gray-200 hover:bg-white shadow-sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-xl text-[13px] font-medium border-gray-200 hover:bg-white shadow-sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setDetailModal({ open: false, title: '', content: '' })}
          />
          <div className="relative bg-white border border-gray-100 rounded-3xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight">{detailModal.title}</h3>
              <button
                onClick={() => setDetailModal({ open: false, title: '', content: '' })}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              <pre className="text-[12px] text-gray-700 whitespace-pre-wrap break-all font-mono bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                {detailModal.content}
              </pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <Button
                variant="outline"
                className="rounded-xl font-medium w-full"
                onClick={() => setDetailModal({ open: false, title: '', content: '' })}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Modal */}
      {clearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setClearModal(false)}
          />
          <div className="relative bg-white border border-gray-100 rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-2 tracking-tight">Clear Audit Logs</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
                Are you sure you want to clear audit logs? This action cannot be undone.
              </p>
              
              <div className="space-y-3 mb-8">
                <Label className="text-[12px] font-semibold uppercase text-gray-500 tracking-wider">Older Than (Days)</Label>
                <Input
                  type="number"
                  min="0"
                  value={olderThan}
                  onChange={(e) => setOlderThan(e.target.value)}
                  placeholder="Leave empty to clear all"
                  className="h-11 rounded-xl border-gray-200 focus:border-primary/30 focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setClearModal(false)}
                  disabled={clearing}
                  className="rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleClearLogs(olderThan ? parseInt(olderThan) : undefined)}
                  disabled={clearing}
                  className="rounded-xl shadow-sm"
                >
                  {clearing ? 'Clearing...' : 'Clear Logs'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
