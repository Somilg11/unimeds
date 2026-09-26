import type { Metadata } from 'next';
import { AppointmentDetail } from './appointment-detail';

export const metadata: Metadata = { title: 'Appointment' };

export default function AppointmentPage() {
  return <AppointmentDetail />;
}
