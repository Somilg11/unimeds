import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/landing/legal-layout';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'What information Unimeds collects and how it is used.' };

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="September 27, 2026">
      <h2>1. About this policy</h2>
      <p>
        This policy explains what information Unimeds (&quot;we&quot;, &quot;us&quot;) collects when you use the platform, how we use
        it, and the choices you have.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> your name, email address and role (patient, doctor or clinic administrator). If you sign
          in with Google, we receive your name, email address and profile picture from Google.
        </li>
        <li>
          <strong>Profile details you choose to add:</strong> for example phone number, date of birth, blood type, allergies, address and
          an emergency contact.
        </li>
        <li>
          <strong>Appointments:</strong> the doctor, clinic, time and reason for each booking, and any clinical notes a doctor records.
        </li>
        <li>
          <strong>Medical records:</strong> files you or your doctor upload, such as reports and prescriptions.
        </li>
        <li>
          <strong>Technical data:</strong> basic server logs (such as IP address and request times) used to operate and secure the service.
        </li>
      </ul>

      <h2>3. How we use it</h2>
      <ul>
        <li>To let you book, manage and attend appointments.</li>
        <li>To share records with the clinics and doctors you choose, by attaching them to a visit.</li>
        <li>To send notifications and emails about your account and appointments.</li>
        <li>To keep the service secure, including maintaining an audit log of important actions.</li>
      </ul>

      <h2>4. Who can see your information</h2>
      <ul>
        <li>Doctors and clinic staff see the details of appointments booked with them, and records shared with that visit.</li>
        <li>Platform administrators can access data where needed to operate and support the service.</li>
        <li>
          We use service providers to run the platform (for example hosting, file storage and email delivery). They process data only on
          our behalf.
        </li>
        <li>We do not sell your personal information.</li>
      </ul>

      <h2>5. Security</h2>
      <p>
        Data is encrypted in transit using HTTPS. Medical files are stored privately and only served to authorized users after an access
        check. Access is role-based and passwords are stored as salted hashes. See <Link href="/legal/security">Security</Link> for more.
      </p>

      <h2>6. Your choices</h2>
      <ul>
        <li>You can view and update your profile at any time.</li>
        <li>Patients can download a copy of their data from their profile settings.</li>
        <li>Patients can delete their account from their profile settings once they have no upcoming appointments.</li>
        <li>Patients can delete records from their own records list.</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>We use cookies that are needed to keep you signed in. We do not use advertising cookies.</p>

      <h2>8. Changes</h2>
      <p>If we change this policy, we will post the new version here and update the date above.</p>

      <h2>9. Contact</h2>
      <p>
        Questions about privacy? Email <a href="mailto:support@unimeds.app?subject=Privacy%20question">support@unimeds.app</a>.
      </p>
    </LegalLayout>
  );
}
