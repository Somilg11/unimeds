import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PatientDashboardClient } from '@/app/user/_components/patient-dashboard-client';
import { TimelineItem } from '@/types/user';
import apiClient from '@/lib/api-client';

export default async function PatientDashboard() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/user');
  }

  // Fetch timeline from backend
  let timelineData: TimelineItem[] = [];
  try {
    const response = await apiClient.get('/user/timeline');
    const timeline = response.data.timeline || [];
    
    timelineData = timeline.map((item: any) => {
      if (item.type === 'record') {
        return {
          id: item.data.id,
          type: 'record' as const,
          date: item.data.createdAt,
          title: item.data.fileName,
          description: item.data.recordType,
          status: item.data.ocrData?.processingStatus || 'pending',
          metadata: {
            recordType: item.data.recordType,
            fileType: item.data.mimeType,
            fileSize: item.data.fileSize,
          }
        };
      } else if (item.type === 'appointment') {
        return {
          id: item.data.id,
          type: 'appointment' as const,
          date: item.data.slotTime,
          title: 'Appointment',
          description: item.data.notes || 'Medical appointment',
          status: item.data.status,
          metadata: {
            doctorName: 'Doctor', // Will be fetched separately if needed
            location: 'Clinic',
            appointmentTime: item.data.slotTime,
          }
        };
      }
      return {
        id: item.data.id,
        type: 'record' as const,
        date: item.date,
        title: 'Health Event',
        description: '',
        metadata: {}
      };
    });
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
  }

  return <PatientDashboardClient initialTimeline={timelineData} userName={session.user.name || 'User'} />;
}
