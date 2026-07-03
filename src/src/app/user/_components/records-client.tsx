'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadZone } from './upload-zone';
import { BentoCard } from './bento-card';
import { FileText, Eye, Trash2, Search, Calendar, Loader2, UserPlus } from 'lucide-react';
import { MedicalRecord } from '@/types/user';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { DocumentViewer } from '@/app/doctor/_components/document-viewer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RecordsClientProps {
  userName?: string;
}

interface EnrichedRecord extends MedicalRecord {
  uploadedBy?: string | null;
  uploaderName?: string | null;
}

const RECORD_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
];

export function RecordsClient({ userName }: RecordsClientProps) {
  const [records, setRecords] = useState<EnrichedRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'lab_report' | 'prescription' | 'imaging' | 'discharge_summary'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadRecordType, setUploadRecordType] = useState('general');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<EnrichedRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await apiClient.get('/user/timeline');
      const timeline = response.data.timeline || [];
      
      const medicalRecords: EnrichedRecord[] = timeline
        .filter((item: any) => item.type === 'record')
        .map((item: any) => ({
          id: item.data.id,
          fileName: item.data.fileName,
          fileType: item.data.mimeType || 'application/octet-stream',
          fileSize: parseInt(item.data.fileSize || '0'),
          uploadDate: item.data.createdAt,
          recordType: (item.data.recordType as MedicalRecord['recordType']) || 'other',
          ocrStatus: (item.data.ocrData?.processingStatus as MedicalRecord['ocrStatus']) || 'pending',
          ocrData: item.data.ocrData ? {
            extractedText: item.data.ocrData.extractedText,
            keyFindings: item.data.ocrData.keyFindings,
            medications: item.data.ocrData.medications,
            diagnoses: item.data.ocrData.diagnoses,
          } : undefined,
          s3Url: item.data.fileUrl,
          uploadedBy: item.data.uploadedBy,
          uploaderName: item.data.uploaderName,
        }));
      
      setRecords(medicalRecords);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Step 1: Get signed upload URL from backend
      const uploadRes = await apiClient.post('/user/records/upload', {
        fileName: file.name,
        fileType: file.type,
        recordType: uploadRecordType,
      });
      const { uploadUrl, signature, timestamp: ts, publicId } = uploadRes.data;

      // Step 2: Upload file directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '');
      formData.append('timestamp', String(ts));
      formData.append('public_id', publicId);
      formData.append('upload_preset', 'medical_uploads');
      formData.append('signature', signature);

      const cloudinaryRes = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!cloudinaryRes.ok) {
        throw new Error('Failed to upload file to Cloudinary');
      }

      toast.success('Record uploaded successfully');
      fetchRecords();
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    setDeletingId(recordId);
    try {
      await apiClient.delete(`/user/records/${recordId}`);
      toast.success('Record deleted');
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('Failed to delete record. Please try again.');
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || record.recordType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getRecordTypeBadge = (type: MedicalRecord['recordType']) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'outline'> = {
      lab_report: 'default',
      prescription: 'secondary',
      imaging: 'outline',
      discharge_summary: 'default',
      other: 'secondary',
    };

    return (
      <Badge 
        variant={variantMap[type] || 'secondary'} 
        className="text-[10px] font-mono uppercase tracking-wider"
      >
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const getOcrStatusBadge = (status: MedicalRecord['ocrStatus']) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'outline'> = {
      pending: 'secondary',
      processing: 'secondary',
      completed: 'default',
      failed: 'outline',
    };

    return (
      <Badge 
        variant={variantMap[status] || 'secondary'} 
        className="text-[10px] font-mono uppercase tracking-wider"
      >
        {status}
      </Badge>
    );
  };

  return (
    <div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.fileName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId === deleteTarget?.id}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === deleteTarget?.id}
              onClick={() => deleteTarget && handleDeleteRecord(deleteTarget.id)}
            >
              {deletingId === deleteTarget?.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Patient Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Medical Records
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your health documents
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-4">
          <BentoCard title="Upload Documents" icon={<FileText className="w-4 h-4" />}>
            <div className="mb-4">
              <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                Record Type
              </label>
              <Select value={uploadRecordType} onValueChange={setUploadRecordType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <UploadZone onUpload={handleFileUpload} />
          </BentoCard>
        </div>

        {/* Records List */}
        <div className="lg:col-span-8">
          <BentoCard title="Your Records" icon={<FileText className="w-4 h-4" />}>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div className="flex gap-px bg-gray-200 border border-gray-200">
                {(['all', 'lab_report', 'prescription', 'imaging', 'discharge_summary'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                    className={`text-[11px] font-mono uppercase tracking-wider h-10 rounded-none ${
                      selectedFilter === filter
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {filter.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Records Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Loading records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="space-y-px bg-gray-200 border border-gray-200">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white p-4 hover:bg-gray-50/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {getRecordTypeBadge(record.recordType)}
                          {getOcrStatusBadge(record.ocrStatus)}
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 tracking-tight truncate">
                          {record.fileName}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.uploadDate).toLocaleDateString()}
                      </div>
                      <div>
                        {(record.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                      {record.uploaderName && (
                        <div className="flex items-center gap-1">
                          <UserPlus className="w-3 h-3" />
                          by {record.uploaderName}
                        </div>
                      )}
                    </div>

                    {record.ocrData?.keyFindings && record.ocrStatus === 'completed' && (
                      <div className="mb-3">
                        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                          Key Findings
                        </p>
                        <div className="text-xs text-gray-600 bg-gray-50 p-3 border border-dashed border-gray-300">
                          {record.ocrData.keyFindings.slice(0, 2).map((finding, idx) => (
                            <div key={idx} className="mb-1 last:mb-0">
                              &bull; {finding}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingRecord(record)}
                        className="flex-1 inline-flex items-center justify-center text-[11px] font-mono uppercase tracking-wider h-8 border border-dashed border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-2" />
                        View
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[11px] font-mono uppercase tracking-wider h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingId === record.id}
                        onClick={() => setDeleteTarget(record)}
                      >
                        {deletingId === record.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-300">
                <FileText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-1">No records found</p>
                <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                  Upload your first medical document to get started
                </p>
              </div>
            )}
          </BentoCard>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingRecord && (
        <DocumentViewer
          fileUrl={viewingRecord.s3Url || ''}
          fileName={viewingRecord.fileName}
          mimeType={viewingRecord.fileType}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </div>
  );
}
