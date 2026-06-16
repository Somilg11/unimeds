'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Download } from 'lucide-react';

interface Record {
  id: string;
  fileName: string;
  recordType: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string;
  ocrData: { processingStatus?: string } | null;
}

interface DoctorRecordsClientProps {
  userName: string;
  token: string;
}

export function DoctorRecordsClient({ userName, token }: DoctorRecordsClientProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [token]);

  async function fetchRecords() {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/records', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const filtered = records.filter(r =>
    r.fileName?.toLowerCase().includes(search.toLowerCase()) ||
    r.recordType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Doctor Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Medical Records
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View patient records
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md bg-white border border-gray-200"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No records found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((record) => (
            <div key={record.id} className="border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{record.fileName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{record.recordType}</div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {record.ocrData?.processingStatus || 'pending'}
                  </Badge>
                  <div className="text-xs text-gray-400">
                    {new Date(record.createdAt).toLocaleDateString()}
                  </div>
                  <a
                    href={record.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
