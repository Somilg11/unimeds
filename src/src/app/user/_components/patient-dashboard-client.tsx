'use client';

import { useState, useEffect } from 'react';
import { UploadZone } from './upload-zone';
import { TimelineGrid } from './timeline-grid';
import { BentoCard } from './bento-card';
import { Calendar, FileText, User, Activity, ArrowRight, Clock, Check, X, Loader2 } from 'lucide-react';
import { TimelineItem } from '@/types/user';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RescheduleProposal {
  appointmentId: string;
  proposedTime: string;
  reason?: string;
  doctorName?: string;
  clinicName?: string;
}

const RECORD_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
];

interface PatientDashboardClientProps {
  initialTimeline: TimelineItem[];
  userName: string;
}

export function PatientDashboardClient({ initialTimeline, userName }: PatientDashboardClientProps) {
  const [timelineData] = useState<TimelineItem[]>(initialTimeline);
  const [rescheduleProposals, setRescheduleProposals] = useState<RescheduleProposal[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [uploadRecordType, setUploadRecordType] = useState('general');

  useEffect(() => {
    // Extract reschedule proposals from timeline
    const proposals = timelineData
      .filter(
        (item) =>
          item.type === 'appointment' &&
          (item.status === 'reschedule_proposed' || item.metadata?.status === 'reschedule_proposed')
      )
      .map((item) => ({
        appointmentId: item.id,
        proposedTime: item.date,
        reason: item.description,
        doctorName: item.metadata?.doctorName,
        clinicName: item.metadata?.clinicName,
      }));
    setRescheduleProposals(proposals);
  }, [timelineData]);

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
      window.location.reload();
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    }
  };

  const handleRescheduleResponse = async (appointmentId: string, accept: boolean) => {
    setRespondingTo(appointmentId);
    try {
      await apiClient.post(`/user/appointments/${appointmentId}/respond-reschedule`, {
        accept,
      });
      toast.success(accept ? 'Appointment rescheduled successfully' : 'Appointment cancelled');
      setRescheduleProposals((prev) => prev.filter((p) => p.appointmentId !== appointmentId));
    } catch (error) {
      console.error('Failed to respond to reschedule:', error);
      toast.error('Failed to respond. Please try again.');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingId(appointmentId);
    try {
      await apiClient.post(`/user/appointments/${appointmentId}/cancel`);
      toast.success('Appointment cancelled');
      setConfirmCancelId(null);
      window.location.reload();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error('Failed to cancel appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const upcomingAppointments = timelineData
    .filter(
      (item) =>
        item.type === 'appointment' &&
        new Date(item.date) >= new Date() &&
        item.status !== 'reschedule_proposed' &&
        item.status !== 'cancelled'
    )
    .slice(0, 3);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
          Patient Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {userName}
        </p>
      </div>

      {/* Reschedule Proposals */}
      {rescheduleProposals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            Reschedule Proposals
          </h2>
          <div className="space-y-2">
            {rescheduleProposals.map((proposal) => (
              <div
                key={proposal.appointmentId}
                className="border border-yellow-100 bg-yellow-50/50 p-6 rounded-3xl shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {proposal.doctorName || 'Your doctor'} has proposed a new time
                    </p>
                    <p className="text-xs text-gray-600 mt-1" suppressHydrationWarning>
                      New time: {new Date(proposal.proposedTime).toLocaleDateString()} at{' '}
                      {new Date(proposal.proposedTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {proposal.reason && (
                      <p className="text-xs text-gray-500 mt-1">Reason: {proposal.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleRescheduleResponse(proposal.appointmentId, true)}
                      disabled={respondingTo === proposal.appointmentId}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-medium rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {respondingTo === proposal.appointmentId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleRescheduleResponse(proposal.appointmentId, false)}
                      disabled={respondingTo === proposal.appointmentId}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Activity className="w-5 h-5" />
             </div>
             <span className="text-[13px] font-medium text-gray-500">Total Events</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{timelineData.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Calendar className="w-5 h-5" />
             </div>
             <span className="text-[13px] font-medium text-gray-500">Upcoming</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <FileText className="w-5 h-5" />
             </div>
             <span className="text-[13px] font-medium text-gray-500">Records</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{timelineData.filter((i) => i.type === 'record').length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover-lift animate-subtle" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <User className="w-5 h-5" />
             </div>
             <span className="text-[13px] font-medium text-gray-500">Appointments</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{timelineData.filter((i) => i.type === 'appointment').length}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload + Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <BentoCard title="Upload Records" icon={<Activity className="w-4 h-4" />}>
            <div className="mb-4">
              <label className="text-[12px] font-medium text-gray-600 mb-2 block ml-1">
                Record Type
              </label>
              <Select value={uploadRecordType} onValueChange={setUploadRecordType}>
                <SelectTrigger className="w-full rounded-xl border-gray-200 shadow-sm bg-white hover:bg-gray-50/50 transition-colors">
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

          <BentoCard title="Health Timeline" icon={<Activity className="w-4 h-4" />}>
            <TimelineGrid items={timelineData} />
          </BentoCard>
        </div>

        {/* Right Column: Appointments + Actions */}
        <div className="lg:col-span-4 space-y-6">
          <BentoCard title="Upcoming Appointments" icon={<Calendar className="w-4 h-4" />}>
            <div className="space-y-3">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 sm:p-5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-primary mb-1" suppressHydrationWarning>
                          {new Date(appointment.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 tracking-tight">
                          {appointment.metadata?.doctorName || 'Doctor'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{appointment.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {confirmCancelId === appointment.id ? (
                          <>
                            <button
                              onClick={() => handleCancelAppointment(appointment.id)}
                              disabled={cancellingId === appointment.id}
                              className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                              {cancellingId === appointment.id ? 'Cancelling...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors bg-white shadow-sm"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmCancelId(appointment.id)}
                            className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">No upcoming appointments</p>
                </div>
              )}
            </div>
          </BentoCard>

          <BentoCard title="Quick Actions" icon={<User className="w-4 h-4" />}>
            <div className="flex flex-col gap-3">
              <Link
                href="/user/book"
                className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-colors group hover-lift shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[13px] font-medium text-gray-900">Book Appointment</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-all" />
              </Link>
              <Link
                href="/user/records"
                className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-colors group hover-lift shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[13px] font-medium text-gray-900">View Records</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-all" />
              </Link>
              <Link
                href="/user/medical-history"
                className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-colors group hover-lift shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[13px] font-medium text-gray-900">Medical History</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-all" />
              </Link>
              <Link
                href="/user/profile"
                className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-colors group hover-lift shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[13px] font-medium text-gray-900">Update Profile</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-all" />
              </Link>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
