'use client';

import { useState } from 'react';
import { UploadZone } from './upload-zone';
import { TimelineGrid } from './timeline-grid';
import { BentoCard } from './bento-card';
import { Calendar, FileText, User, Activity, ArrowRight } from 'lucide-react';
import { TimelineItem } from '@/types/user';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';

interface PatientDashboardClientProps {
  initialTimeline: TimelineItem[];
  userName: string;
}

export function PatientDashboardClient({ initialTimeline, userName }: PatientDashboardClientProps) {
  const [timelineData] = useState<TimelineItem[]>(initialTimeline);

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);
      formData.append('recordType', 'general');
      
      await apiClient.post('/user/records/upload', formData);
      window.location.reload();
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file. Please try again.');
    }
  };

  const upcomingAppointments = timelineData
    .filter(item => item.type === 'appointment' && new Date(item.date) >= new Date())
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 mb-6">
        <div className="bg-white p-5">
          <Activity className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{timelineData.length}</p>
          <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Total Events</p>
        </div>
        <div className="bg-white p-5">
          <Calendar className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
          <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Upcoming</p>
        </div>
        <div className="bg-white p-5">
          <FileText className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {timelineData.filter(i => i.type === 'record').length}
          </p>
          <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Records</p>
        </div>
        <div className="bg-white p-5">
          <User className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {timelineData.filter(i => i.type === 'appointment').length}
          </p>
          <p className="text-[11px] font-mono uppercase text-gray-400 mt-1">Appointments</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload + Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <BentoCard title="Upload Records" icon={<Activity className="w-4 h-4" />}>
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
                    className="p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-[11px] font-mono uppercase text-gray-400 mb-1">
                      {new Date(appointment.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 tracking-tight">
                      {appointment.metadata?.doctorName || 'Doctor'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {appointment.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300">
                  <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No upcoming appointments</p>
                </div>
              )}
            </div>
          </BentoCard>

          <BentoCard title="Quick Actions" icon={<User className="w-4 h-4" />}>
            <div className="space-y-px bg-gray-200 border border-gray-200">
              <Link href="/user/book" className="flex items-center justify-between bg-white p-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-[13px] font-medium text-gray-900">Book Appointment</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
              </Link>
              <Link href="/user/records" className="flex items-center justify-between bg-white p-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-[13px] font-medium text-gray-900">View Records</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
              </Link>
              <Link href="/user/profile" className="flex items-center justify-between bg-white p-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-[13px] font-medium text-gray-900">Update Profile</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
