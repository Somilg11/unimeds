'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Clock, User, Loader2, Eye, Stethoscope } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { DocumentViewer } from '@/app/doctor/_components/document-viewer';

interface MedicalRecord {
  id: string;
  fileUrl: string;
  recordType: string;
  fileName: string;
  fileSize: string | null;
  mimeType: string | null;
  ocrData: {
    processingStatus?: string;
    medications?: string[];
    diagnoses?: string[];
    summary?: string;
  } | null;
  uploadedBy: string | null;
  createdAt: string;
  uploaderName: string | null;
}

interface MedicalAppointment {
  id: string;
  slotTime: string;
  status: string;
  notes: string | null;
  proposedTime: string | null;
  proposedBy: string | null;
  rescheduleReason: string | null;
  doctorName: string;
  clinicName: string;
}

interface MedicalHistoryClientProps {
  userName: string;
}

export function MedicalHistoryClient({ userName }: MedicalHistoryClientProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<MedicalAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'records' | 'appointments'>('all');
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    fetchMedicalHistory();
  }, []);

  const fetchMedicalHistory = async () => {
    try {
      const response = await apiClient.get('/user/medical-history');
      setRecords(response.data.records || []);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch medical history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      reschedule_proposed: 'outline',
    };
    return (
      <Badge variant={variantMap[status] || 'secondary'} className="text-[10px] font-mono uppercase tracking-wider rounded-full px-2.5">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getRecordTypeBadge = (type: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'outline'> = {
      lab_report: 'default',
      prescription: 'secondary',
      imaging: 'outline',
    };
    return (
      <Badge variant={variantMap[type] || 'secondary'} className="text-[10px] font-mono uppercase tracking-wider rounded-full px-2.5">
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  // Combine records and appointments into a unified timeline
  const timeline = [
    ...records.map((r) => ({
      type: 'record' as const,
      date: r.createdAt,
      data: r,
    })),
    ...appointments.map((a) => ({
      type: 'appointment' as const,
      date: a.slotTime,
      data: a,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTimeline = timeline.filter((item) => {
    if (activeTab === 'records') return item.type === 'record';
    if (activeTab === 'appointments') return item.type === 'appointment';
    return true;
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Patient Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Medical History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete timeline of your health records and appointments
        </p>
      </div>

      {/* Tab Filter */}
      <div className="flex gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-100/50 mb-6 w-fit overflow-x-auto hide-scrollbar">
        {(['all', 'records', 'appointments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[13px] font-medium capitalize tracking-wide rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
        </div>
      ) : filteredTimeline.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-3xl p-16 text-center bg-gray-50/50">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-[15px] font-semibold text-gray-900 mb-1">No medical history found</p>
          <p className="text-[13px] text-gray-500">Your records and appointments will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTimeline.map((item) =>
            item.type === 'record' ? (
              <div key={`record-${item.data.id}`} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    {getRecordTypeBadge(item.data.recordType)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
                <h4 className="text-[15px] font-semibold text-gray-900 mb-1 tracking-tight">{item.data.fileName}</h4>
                {item.data.uploaderName && (
                  <p className="text-[13px] text-gray-500 mb-2">
                    Uploaded by: <span className="font-medium text-gray-700">{item.data.uploaderName}</span>
                  </p>
                )}
                {item.data.ocrData?.summary && (
                  <div className="text-[13px] text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100 mt-3 leading-relaxed">
                    {item.data.ocrData.summary}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setViewingRecord(item.data)}
                    className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide h-10 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 px-4 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Document
                  </button>
                </div>
              </div>
            ) : (
              <div key={`appointment-${item.data.id}`} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-green-500" />
                    </div>
                    {getStatusBadge(item.data.status)}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[12px] font-medium text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <h4 className="text-[15px] font-semibold text-gray-900 mb-1 tracking-tight">
                  Appointment with {item.data.doctorName}
                </h4>
                <p className="text-[13px] text-gray-500 mb-1">{item.data.clinicName}</p>
                {item.data.notes && (
                  <div className="text-[13px] text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100 mt-3 leading-relaxed">
                    {item.data.notes}
                  </div>
                )}
                {item.data.status === 'reschedule_proposed' && item.data.proposedTime && (
                  <div className="mt-3 p-4 rounded-xl bg-yellow-50/50 border border-yellow-100">
                    <p className="text-[13px] font-semibold text-yellow-800 mb-1">Reschedule Proposed</p>
                    <p className="text-[13px] text-yellow-700">
                      New time: {new Date(item.data.proposedTime).toLocaleDateString()} at{' '}
                      {new Date(item.data.proposedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.data.rescheduleReason && (
                      <p className="text-[13px] text-yellow-600 mt-1.5">Reason: {item.data.rescheduleReason}</p>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingRecord && (
        <DocumentViewer
          fileUrl={viewingRecord.fileUrl}
          fileName={viewingRecord.fileName}
          mimeType={viewingRecord.mimeType || 'application/pdf'}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </div>
  );
}
