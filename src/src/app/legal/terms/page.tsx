import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/landing/legal-layout';

export const metadata: Metadata = { title: 'Terms of Service', description: 'The terms that apply when you use Unimeds.' };

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="September 27, 2026">
      <h2>1. Using Unimeds</h2>
      <p>By creating an account or using Unimeds (&quot;the platform&quot;), you agree to these terms. If you don&apos;t agree, please don&apos;t use the platform.</p>

      <h2>2. What Unimeds does</h2>
      <p>
        Unimeds helps patients find doctors and book appointments at clinics, helps clinics manage their schedules and teams, and lets
        patients and their care providers share medical records.
      </p>

      <h2>3. Not medical advice</h2>
      <p>
        Unimeds is a booking and records tool. It does not provide medical advice, diagnosis or treatment. Care decisions are made by
        qualified healthcare professionals. In an emergency, contact your local emergency services — don&apos;t wait for an online booking.
      </p>

      <h2>4. Your account</h2>
      <p>
        Keep your password private and let us know if you think someone else has accessed your account. You are responsible for activity
        on your account.
      </p>

      <h2>5. Appointments</h2>
      <p>
        Each clinic sets its own booking policy, including how far ahead you can book and how late you can cancel online. These are shown
        on the clinic&apos;s page. The clinic may confirm, reschedule or cancel appointments.
      </p>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>Don&apos;t use the platform for anything unlawful.</li>
        <li>Don&apos;t try to access data you aren&apos;t authorized to see.</li>
        <li>Don&apos;t upload malicious files or interfere with the service.</li>
        <li>Only upload records you have the right to share.</li>
      </ul>

      <h2>7. Your data</h2>
      <p>
        How we handle your information is described in our <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>

      <h2>8. Liability</h2>
      <p>
        To the extent permitted by law, Unimeds is not liable for indirect or consequential losses arising from your use of the platform.
      </p>

      <h2>9. Ending your use</h2>
      <p>
        You can stop using Unimeds at any time, and patients can delete their account from their settings. We may suspend accounts that
        break these terms.
      </p>

      <h2>10. Changes</h2>
      <p>If we change these terms, we will post the new version here and update the date above.</p>

      <h2>11. Contact</h2>
      <p>
        Questions? Email <a href="mailto:support@unimeds.app?subject=Terms%20question">support@unimeds.app</a>.
      </p>
    </LegalLayout>
  );
}
