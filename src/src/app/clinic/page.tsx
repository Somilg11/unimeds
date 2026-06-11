import { Building2 } from 'lucide-react';
import { PortalWelcome } from '@/components/portal-welcome';
import { signInClinic } from '@/app/auth/actions';

export default function ClinicWelcome() {
  return (
    <PortalWelcome
      title="Clinic Admin"
      subtitle="Welcome to UniMeds"
      description="Manage appointments, patients, records, and clinic settings. Sign in to access your dashboard."
      icon={Building2}
      signInAction={signInClinic}
    />
  );
}
