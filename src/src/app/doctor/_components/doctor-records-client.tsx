'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="bg-zinc-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Medical Records</h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">View patient records</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 max-w-md bg-white border border-zinc-200"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white border border-zinc-200">
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
              <p className="text-zinc-500 text-sm">No records found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((record) => (
              <Card key={record.id} className="bg-white border border-zinc-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">{record.fileName}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{record.recordType}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        {record.ocrData?.processingStatus || 'pending'}
                      </Badge>
                      <div className="text-xs text-zinc-400">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                      <a
                        href={record.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-zinc-900"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
