import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PatientDashboardClient } from '@/app/user/_components/patient-dashboard-client';
import { TimelineItem } from '@/types/user';

export default async function PatientDashboard() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/user');
  }

  // Use mock data for demo (API call moved to client component)
  const timelineData: TimelineItem[] = [
    {
      id: '1',
      type: 'appointment',
      date: '2026-06-08',
      title: 'General Checkup',
      description: 'City Medical Center',
      status: 'confirmed',
      metadata: { doctorName: 'Dr. Smith', location: 'City Medical Center' }
    },
    {
      id: '2',
      type: 'record',
      date: '2026-06-01',
      title: 'Lab Results Uploaded',
      description: 'Blood work complete',
      metadata: { recordType: 'Lab Report' }
    }
  ];

  return <PatientDashboardClient initialTimeline={timelineData} userName={session.user.name || 'User'} />;
}
