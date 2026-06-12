import { LegalLayout } from '@/components/landing/legal-layout';

export default function Compliance() {
  return (
    <LegalLayout title="Compliance" lastUpdated="June 12, 2026">
      <h2>Regulatory Compliance</h2>
      <p>
        UniMeds is designed to help healthcare organizations meet their regulatory obligations. We maintain compliance with key healthcare and data protection standards.
      </p>

      <h2>HIPAA</h2>
      <p>
        UniMeds is fully HIPAA compliant. We sign Business Associate Agreements (BAAs) with covered entities and implement all required administrative, physical, and technical safeguards to protect Protected Health Information (PHI).
      </p>
      <ul>
        <li>Administrative safeguards including workforce training and security management</li>
        <li>Physical safeguards for data center and device security</li>
        <li>Technical safeguards including access controls, audit controls, and encryption</li>
        <li>Breach notification procedures within required timeframes</li>
      </ul>

      <h2>GDPR</h2>
      <p>
        For users in the European Economic Area, we comply with the General Data Protection Regulation (GDPR). This includes:
      </p>
      <ul>
        <li>Lawful basis for processing personal data</li>
        <li>Data Protection Impact Assessments for high-risk processing</li>
        <li>Appointment of Data Protection Officer</li>
        <li>Cross-border data transfer mechanisms (Standard Contractual Clauses)</li>
        <li>Data subject rights implementation</li>
      </ul>

      <h2>SOC 2</h2>
      <p>
        UniMeds maintains SOC 2 Type II compliance, demonstrating our commitment to security, availability, processing integrity, confidentiality, and privacy. Audit reports are available upon request for enterprise customers.
      </p>

      <h2>HITRUST</h2>
      <p>
        We are pursuing HITRUST CSF certification to further demonstrate our commitment to healthcare information security. This certification provides a comprehensive, prescriptive framework for managing risk.
      </p>

      <h2>State Regulations</h2>
      <p>
        UniMeds complies with applicable state-level healthcare privacy regulations, including CCPA (California), CMIA (California), and other state-specific health data protection laws.
      </p>

      <h2>Compliance Documentation</h2>
      <p>
        Enterprise customers can request the following compliance documentation:
      </p>
      <ul>
        <li>SOC 2 Type II audit report</li>
        <li>HIPAA BAA template</li>
        <li>Security questionnaire responses</li>
        <li>Data Processing Agreement (DPA)</li>
        <li>Penetration test summary report</li>
      </ul>

      <h2>Contact</h2>
      <p>
        For compliance-related inquiries, including BAA requests and security documentation, contact compliance@unimeds.com.
      </p>
    </LegalLayout>
  );
}
