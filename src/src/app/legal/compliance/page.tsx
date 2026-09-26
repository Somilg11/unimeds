import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/landing/legal-layout';

export const metadata: Metadata = { title: 'Compliance', description: 'Where Unimeds stands on healthcare and data-protection compliance.' };

export default function Compliance() {
  return (
    <LegalLayout title="Compliance" lastUpdated="September 27, 2026">
      <h2>Where we are today</h2>
      <p>
        Unimeds has not yet completed any third-party certification or audit (for example SOC 2,
        ISO 27001 or HITRUST), and we do not currently sign Business Associate Agreements. We will update this page if that changes.
      </p>
      <p>
        Clinics using Unimeds remain responsible for meeting the healthcare and data-protection rules that apply to their practice in
        their jurisdiction.
      </p>

      <h2>Controls in place</h2>
      <p>The product includes controls that support good data-protection practice:</p>
      <ul>
        <li>Encryption in transit (HTTPS) for all traffic.</li>
        <li>Medical files stored privately and served only to authorized users after an access check.</li>
        <li>Role-based access, enforced on the server.</li>
        <li>An append-only audit log of important actions, visible to clinic administrators for their clinic.</li>
        <li>Password hashing and rate-limited sign-in.</li>
        <li>Self-service data export and account deletion for patients.</li>
      </ul>
      <p>
        See <Link href="/legal/security">Security</Link> and the <Link href="/legal/privacy">Privacy Policy</Link> for details.
      </p>

      <h2>Questions</h2>
      <p>
        For compliance questions, email <a href="mailto:support@unimeds.app?subject=Compliance%20question">support@unimeds.app</a>.
      </p>
    </LegalLayout>
  );
}
