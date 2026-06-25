'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Clock, User, Loader2, Download, Stethoscope } from 'lucide-react';
import apiClient from '@/lib/api-client';

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
      <Badge variant={variantMap[status] || 'secondary'} className="text-[10px] font-mono uppercase tracking-wider">
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
      <Badge variant={variantMap[type] || 'secondary'} className="text-[10px] font-mono uppercase tracking-wider">
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
      <div className="flex gap-px bg-gray-200 border border-gray-200 mb-6">
        {(['all', 'records', 'appointments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : filteredTimeline.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No medical history found</p>
        </div>
      ) : (
        <div className="space-y-px bg-gray-200 border border-gray-200">
          {filteredTimeline.map((item) =>
            item.type === 'record' ? (
              <div key={`record-${item.data.id}`} className="bg-white p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    {getRecordTypeBadge(item.data.recordType)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{item.data.fileName}</h4>
                {item.data.uploaderName && (
                  <p className="text-xs text-gray-500 mb-2">
                    Uploaded by: <span className="font-medium">{item.data.uploaderName}</span>
                  </p>
                )}
                {item.data.ocrData?.summary && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 border border-dashed border-gray-300 mt-2">
                    {item.data.ocrData.summary}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <a
                    href={item.data.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 px-3 py-1.5"
                  >
                    <Download className="w-3 h-3" />
                    View
                  </a>
                </div>
              </div>
            ) : (
              <div key={`appointment-${item.data.id}`} className="bg-white p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    {getStatusBadge(item.data.status)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.date).toLocaleDateString()}
                    <Clock className="w-3 h-3 ml-2" />
                    {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  Appointment with {item.data.doctorName}
                </h4>
                <p className="text-xs text-gray-500 mb-1">{item.data.clinicName}</p>
                {item.data.notes && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 border border-dashed border-gray-300 mt-2">
                    {item.data.notes}
                  </p>
                )}
                {item.data.status === 'reschedule_proposed' && item.data.proposedTime && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200">
                    <p className="text-xs font-medium text-yellow-800 mb-1">Reschedule Proposed</p>
                    <p className="text-xs text-yellow-700">
                      New time: {new Date(item.data.proposedTime).toLocaleDateString()} at{' '}
                      {new Date(item.data.proposedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.data.rescheduleReason && (
                      <p className="text-xs text-yellow-600 mt-1">Reason: {item.data.rescheduleReason}</p>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
