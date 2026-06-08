import { Stethoscope } from 'lucide-react';
import { PortalWelcome } from '@/components/portal-welcome';
import { signInDoctor } from '@/app/auth/actions';

export default function DoctorWelcome() {
  return (
    <PortalWelcome
      title="Doctor Portal"
      subtitle="Welcome to UniMeds"
      description="Access patient records, clinical context, and manage your appointments. Sign in to access your dashboard."
      icon={Stethoscope}
      signInAction={signInDoctor}
    />
  );
}
