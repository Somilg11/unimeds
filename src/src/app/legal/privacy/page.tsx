import { LegalLayout } from '@/components/landing/legal-layout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 12, 2026">
      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy describes how UniMeds (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and protects your personal information when you use our Platform. We are committed to protecting your privacy and complying with HIPAA, GDPR, and applicable data protection laws.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Account Information</h3>
      <p>
        When you create an account, we collect your name, email address, and role (patient, doctor, clinic administrator). For OAuth sign-ins, we receive your basic profile information from the authentication provider.
      </p>

      <h3>2.2 Health Information</h3>
      <p>
        Patients may upload medical records, health timelines, and appointment histories. This information is classified as Protected Health Information (PHI) under HIPAA and is handled with the highest level of security.
      </p>

      <h3>2.3 Usage Data</h3>
      <p>
        We automatically collect information about how you interact with the Platform, including IP address, browser type, pages visited, and actions taken within the Platform.
      </p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain the Platform</li>
        <li>To process appointments and manage patient records</li>
        <li>To communicate with you about your account and the Platform</li>
        <li>To improve the Platform and develop new features</li>
        <li>To comply with legal obligations and maintain security</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell your personal information. We may share your information only in the following circumstances:
      </p>
      <ul>
        <li>With your explicit consent</li>
        <li>To comply with legal requirements or court orders</li>
        <li>With service providers who assist in operating the Platform (under strict data processing agreements)</li>
        <li>To protect the rights, property, or safety of UniMeds, our users, or the public</li>
      </ul>

      <h2>5. Data Security</h2>
      <p>
        We implement industry-standard security measures including end-to-end encryption, access controls, audit logging, and regular security assessments. All PHI is encrypted at rest and in transit using AES-256 and TLS 1.3.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        We retain your personal information for as long as your account is active or as needed to provide the Platform. Patient records are retained in accordance with applicable healthcare regulations and your clinic&apos;s data retention policies.
      </p>

      <h2>7. Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your personal information</li>
        <li>Object to or restrict certain processing activities</li>
        <li>Data portability</li>
        <li>Withdraw consent at any time</li>
      </ul>

      <h2>8. Cookies</h2>
      <p>
        We use essential cookies to operate the Platform. We do not use tracking or advertising cookies. You can manage cookie preferences through your browser settings.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date.
      </p>

      <h2>10. Contact</h2>
      <p>
        For questions about this Privacy Policy or our data practices, contact our Data Protection Officer at privacy@unimeds.com.
      </p>
    </LegalLayout>
  );
}
