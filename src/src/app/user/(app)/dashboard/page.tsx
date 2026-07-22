import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PatientDashboardClient } from '@/app/user/_components/patient-dashboard-client';
import { TimelineItem } from '@/types/user';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default async function PatientDashboard() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/user');
  }

  let timelineData: TimelineItem[] = [];
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/user/timeline`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const timeline = data.timeline || [];
      
      timelineData = timeline.map((item: { type: string; data: Record<string, unknown>; date?: string }) => {
        const d = item.data;
        const ocr = (d.ocrData ?? null) as Record<string, unknown> | null;
        if (item.type === 'record') {
          return {
            id: d.id as string,
            type: 'record' as const,
            date: d.createdAt as string,
            title: d.fileName as string,
            description: d.recordType as string,
            status: (ocr?.processingStatus as string) || 'pending',
            metadata: {
              recordType: d.recordType as string,
              fileType: d.mimeType as string,
              fileSize: d.fileSize as string,
            }
          };
        } else if (item.type === 'appointment') {
          return {
            id: d.id as string,
            type: 'appointment' as const,
            date: d.slotTime as string,
            title: 'Appointment',
            description: (d.notes as string) || 'Medical appointment',
            status: d.status as string,
            metadata: {
              doctorName: 'Doctor',
              location: 'Clinic',
              appointmentTime: d.slotTime as string,
            }
          };
        }
        return {
          id: d.id as string,
          type: 'record' as const,
          date: item.date,
          title: 'Health Event',
          description: '',
          metadata: {}
        };
      });
    }
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
  }

  return <PatientDashboardClient initialTimeline={timelineData} userName={session.user.name || 'User'} />;
}
