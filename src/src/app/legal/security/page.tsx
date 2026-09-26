import type { Metadata } from 'next';
import { LegalLayout } from '@/components/landing/legal-layout';

export const metadata: Metadata = { title: 'Security', description: 'How Unimeds protects your account and medical data.' };

export default function Security() {
  return (
    <LegalLayout title="Security" lastUpdated="September 27, 2026">
      <p>
        Unimeds handles appointment and medical information, so we build access control into every part of the product. This page
        describes the safeguards that are in place today.
      </p>

      <h2>Encryption in transit</h2>
      <p>All traffic between your browser and Unimeds is served over HTTPS, so data is encrypted while it travels over the network.</p>

      <h2>Medical files</h2>
      <ul>
        <li>Uploaded records (PDFs and images) are stored as private files. They have no public link.</li>
        <li>
          Each time a file is opened, our server first checks that you are allowed to see it — the patient who owns it, or a doctor or
          clinic the record has been shared with — and only then issues a short-lived link.
        </li>
        <li>Uploads are limited to common document and image formats and a maximum file size.</li>
      </ul>

      <h2>Accounts and access</h2>
      <ul>
        <li>Passwords are never stored in plain text; they are stored as salted hashes.</li>
        <li>
          Access is role-based. Patients, doctors, clinic administrators and platform administrators each see only what their role and
          clinic membership allow, and these checks are enforced on the server for every request.
        </li>
        <li>Your session token is kept in an encrypted, HTTP-only cookie that page scripts cannot read.</li>
        <li>Changing your password signs out your other sessions. You can also sign out of all devices at once.</li>
        <li>Sign-in and password-reset requests are rate limited.</li>
      </ul>

      <h2>Audit log</h2>
      <p>
        Important actions — such as bookings, cancellations, record uploads and team changes — are recorded in an append-only audit
        log. Clinic administrators can review the entries for their clinic.
      </p>

      <h2>Your data</h2>
      <p>
        Patients can download a copy of their data at any time and can delete their account from their profile settings (once they have
        no upcoming appointments).
      </p>

      <h2>Reporting a vulnerability</h2>
      <p>
        If you believe you have found a security issue, please email{' '}
        <a href="mailto:support@unimeds.app?subject=Security%20report">support@unimeds.app</a> with the details. Please don&apos;t
        access other people&apos;s data or disrupt the service while testing.
      </p>
    </LegalLayout>
  );
}
