import { User } from 'lucide-react';
import { PortalWelcome } from '@/components/portal-welcome';
import { signInPatient } from '@/app/auth/actions';

export default function PatientWelcome() {
  return (
    <PortalWelcome
      title="Patient Portal"
      subtitle="Welcome to UniMeds"
      description="Manage your health timeline, upload records, and book appointments. Sign in to access your dashboard."
      icon={User}
      signInAction={signInPatient}
    />
  );
}
