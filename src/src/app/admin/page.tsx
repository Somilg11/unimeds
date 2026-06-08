import { ShieldCheck } from 'lucide-react';
import { PortalWelcome } from '@/components/portal-welcome';
import { signInAdmin } from '@/app/auth/actions';

export default function AdminWelcome() {
  return (
    <PortalWelcome
      title="Super Admin"
      subtitle="Welcome to UniMeds"
      description="Manage clinics, platform metrics, and audit logs across the entire system. Sign in to access your dashboard."
      icon={ShieldCheck}
      signInAction={signInAdmin}
    />
  );
}
