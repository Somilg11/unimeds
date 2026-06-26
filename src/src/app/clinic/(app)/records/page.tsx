'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Search, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface MedicalRecord {
  id: string;
  patientName: string;
  fileName: string;
  recordType: string;
  createdAt: string;
  ocrStatus: string;
  ocrData: { processingStatus?: string } | null;
  fileUrl: string;
}

const RECORD_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'general', label: 'General' },
];

const PAGE_SIZE = 15;

export default function ClinicAdminRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/clinic-admin/records');
      const raw = res.data;
      const recordsList = raw?.records || raw?.data?.records || raw?.data || raw || [];
      setRecords(Array.isArray(recordsList) ? recordsList : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch records';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      record.patientName?.toLowerCase().includes(query) ||
      record.fileName?.toLowerCase().includes(query);
    const matchesType = filterType === 'all' || record.recordType === filterType;
    return matchesSearch && matchesType;
  }).map(r => ({ ...r, ocrStatus: r.ocrStatus || r.ocrData?.processingStatus || 'pending' }));

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function getRecordTypeBadge(type: string) {
    switch (type) {
      case 'prescription':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">Prescription</Badge>;
      case 'lab_report':
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Lab Report</Badge>;
      case 'imaging':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">Imaging</Badge>;
      case 'general':
        return <Badge variant="outline" className="text-[10px]">General</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{type}</Badge>;
    }
  }

  function getOcrStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px]">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{status || '—'}</Badge>;
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Medical Records</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Medical Records</h1>
        <div className="border border-gray-200 p-6">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchRecords}
            className="mt-2 text-sm text-gray-900 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Medical Records</h1>
        <span className="text-xs font-mono uppercase text-gray-400">
          {records.length} total
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by patient or file name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 bg-white border border-gray-200"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[180px] bg-white border border-gray-200">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {RECORD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No records found</p>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">Patient Name</th>
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden sm:table-cell">File Name</th>
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">Record Type</th>
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden md:table-cell">Created Date</th>
                    <th className="text-left p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden lg:table-cell">OCR Status</th>
                    <th className="text-right p-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record, index) => (
                    <tr key={`${record.id}-${index}`} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-900 font-medium">
                        {record.patientName}
                      </td>
                      <td className="p-3 text-sm text-gray-600 max-w-[200px] truncate hidden sm:table-cell">
                        {record.fileName}
                      </td>
                      <td className="p-3">{getRecordTypeBadge(record.recordType)}</td>
                      <td className="p-3 text-sm text-gray-600 hidden md:table-cell">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="p-3 hidden lg:table-cell">{getOcrStatusBadge(record.ocrStatus)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredRecords.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Prev
                </button>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
