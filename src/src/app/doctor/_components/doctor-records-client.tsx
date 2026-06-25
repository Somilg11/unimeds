'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Search, Download, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Record {
  id: string;
  fileName: string;
  recordType: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string;
  ocrData: { processingStatus?: string } | null;
  patientId?: string;
  patientName?: string;
}

interface Patient {
  id: string;
  profileData?: {
    name?: string;
    email?: string;
  };
}

interface DoctorRecordsClientProps {
  userName: string;
  token: string;
}

export function DoctorRecordsClient({ userName, token }: DoctorRecordsClientProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recordType, setRecordType] = useState('general');

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

  const searchPatients = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }
    try {
      const res = await fetch(`/api/doctor/patients/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  const handleFileUpload = async (file: File) => {
    if (!selectedPatient) return;

    setUploading(true);
    try {
      // Step 1: Get signed upload URL from backend
      const uploadRes = await fetch('/api/doctor/records/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          fileName: file.name,
          fileType: file.type,
          recordType,
        }),
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, signature, timestamp: ts, publicId } = await uploadRes.json();

      // Step 2: Upload file to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '');
      formData.append('timestamp', ts);
      formData.append('signature', signature);
      formData.append('folder', 'medical-records');

      const cloudinaryRes = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!cloudinaryRes.ok) {
        throw new Error('Failed to upload to Cloudinary');
      }

      // Success
      toast.success('Record uploaded successfully');
      setShowUploadModal(false);
      setSelectedPatient(null);
      setPatientSearch('');
      setRecordType('general');
      fetchRecords();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload record');
    } finally {
      setUploading(false);
    }
  };

  const filtered = records.filter(r =>
    r.fileName?.toLowerCase().includes(search.toLowerCase()) ||
    r.recordType?.toLowerCase().includes(search.toLowerCase()) ||
    r.patientName?.toLowerCase().includes(search.toLowerCase())
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
          View and upload patient records
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border border-gray-200"
          />
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Record
        </Button>
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
                  <div className="text-xs text-gray-500 mt-0.5">
                    {record.recordType}
                    {record.patientName && <span className="ml-2 text-gray-400">| {record.patientName}</span>}
                  </div>
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-gray-200 w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Upload Record</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedPatient(null);
                  setPatientSearch('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedPatient ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Search Patient
                  </label>
                  <Input
                    placeholder="Type patient name or email..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="bg-white border border-gray-200"
                  />
                </div>
                {patients.length > 0 && (
                  <div className="border border-gray-200 max-h-48 overflow-y-auto">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {patient.profileData?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">{patient.profileData?.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                {patientSearch.length >= 2 && patients.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">No patients found</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPatient.profileData?.name}
                  </p>
                  <p className="text-xs text-gray-500">{selectedPatient.profileData?.email}</p>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Record Type
                  </label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900"
                  >
                    <option value="general">General</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="imaging">Imaging</option>
                    <option value="discharge_summary">Discharge Summary</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Select File
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={uploading}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                  />
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
