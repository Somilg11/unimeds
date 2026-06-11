'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadZone } from './upload-zone';
import { BentoCard } from './bento-card';
import { FileText, Download, Trash2, Search, Calendar, Loader2 } from 'lucide-react';
import { MedicalRecord } from '@/types/user';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface RecordsClientProps {
  userName?: string;
}

export function RecordsClient({ userName }: RecordsClientProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'lab_report' | 'prescription' | 'imaging'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await apiClient.get('/user/timeline');
      const timeline = response.data.timeline || [];
      
      const medicalRecords: MedicalRecord[] = timeline
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);
      formData.append('recordType', 'general');
      
      await apiClient.post('/user/records/upload', formData);
      // Refresh records after upload
      fetchRecords();
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file. Please try again.');
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
        className="text-[10px] tracking-widest uppercase font-bold"
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
        className="text-[10px] tracking-widest uppercase font-bold"
      >
        {status}
      </Badge>
    );
  };

  return (
    <div className="bg-zinc-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Medical Records
              </h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">
                Manage your health documents
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Upload Section */}
          <BentoCard 
            title="Upload Documents"
            icon={<FileText className="w-5 h-5" />}
            className="lg:col-span-1"
          >
            <UploadZone onUpload={handleFileUpload} />
          </BentoCard>

          {/* Records List */}
          <BentoCard 
            title="Your Records"
            icon={<FileText className="w-5 h-5" />}
            className="lg:col-span-2"
          >
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'lab_report', 'prescription', 'imaging'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                    className="text-[10px] tracking-widest uppercase font-bold h-9"
                  >
                    {filter.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Records Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-400 mb-4" />
                <p className="text-sm text-zinc-600">Loading records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-zinc-50 rounded-lg p-4 border border-zinc-200 hover:border-zinc-300 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {getRecordTypeBadge(record.recordType)}
                          {getOcrStatusBadge(record.ocrStatus)}
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-900 tracking-tight truncate">
                          {record.fileName}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-[10px] text-zinc-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.uploadDate).toLocaleDateString()}
                      </div>
                      <div>
                        {(record.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    {record.ocrData?.keyFindings && record.ocrStatus === 'completed' && (
                      <div className="mb-3">
                        <div className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-1">
                          Key Findings
                        </div>
                        <div className="text-xs text-zinc-700 bg-white rounded p-2 border border-dashed border-zinc-300">
                          {record.ocrData.keyFindings.slice(0, 2).map((finding, idx) => (
                            <div key={idx} className="mb-1 last:mb-0">
                              • {finding}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] tracking-widest uppercase font-bold h-8 border-dashed"
                      >
                        <Download className="w-3 h-3 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] tracking-widest uppercase font-bold h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-zinc-300 rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
                <p className="text-sm text-zinc-600 font-medium mb-2">No records found</p>
                <p className="text-xs text-zinc-500">Upload your first medical document to get started</p>
              </div>
            )}
          </BentoCard>

        </div>
      </main>
    </div>
  );
}
