'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadZone } from './upload-zone';
import { TimelineGrid } from './timeline-grid';
import { BentoCard } from './bento-card';
import { Calendar, FileText, User, Activity, ArrowRight } from 'lucide-react';
import { TimelineItem } from '@/types/user';
import apiClient from '@/lib/api-client';
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
      // Refresh timeline after upload
      window.location.reload();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const upcomingAppointments = timelineData
    .filter(item => item.type === 'appointment' && new Date(item.date) >= new Date())
    .slice(0, 3);

  return (
    <div className="bg-zinc-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">
                Welcome back, {userName}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Upload Records Card */}
          <BentoCard 
            title="Upload Records"
            icon={<Activity className="w-5 h-5" />}
          >
            <UploadZone onUpload={handleFileUpload} />
          </BentoCard>

          {/* Health Timeline Card */}
          <BentoCard 
            title="Health Timeline"
            icon={<Activity className="w-5 h-5" />}
            className="md:col-span-2"
          >
            <TimelineGrid items={timelineData} />
          </BentoCard>

          {/* Upcoming Appointments Card */}
          <BentoCard 
            title="Upcoming Appointments"
            icon={<Calendar className="w-5 h-5" />}
          >
            <div className="space-y-3">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="bg-zinc-50 rounded-lg p-4 border border-zinc-200 hover:border-zinc-300 transition-colors"
                  >
                    <div className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-1">
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 tracking-tight">
                      {appointment.metadata?.doctorName || 'Doctor'}
                    </div>
                    <div className="text-xs text-zinc-600 mt-1">
                      {appointment.description}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-zinc-300 rounded-lg">
                  <Calendar className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                  <p className="text-sm text-zinc-600 font-medium">No upcoming appointments</p>
                </div>
              )}
            </div>
          </BentoCard>

          {/* Quick Actions Card */}
          <BentoCard 
            title="Quick Actions"
            icon={<User className="w-5 h-5" />}
          >
            <div className="space-y-2">
              <Link href="/user/book">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  Book Appointment
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/user/records">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-3" />
                  View Records
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/user/profile">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <User className="w-4 h-4 mr-3" />
                  Update Profile
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </BentoCard>

        </div>
      </main>
    </div>
  );
}
