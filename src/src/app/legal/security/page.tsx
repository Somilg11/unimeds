import { LegalLayout } from '@/components/landing/legal-layout';

export default function Security() {
  return (
    <LegalLayout title="Security" lastUpdated="June 12, 2026">
      <h2>Our Commitment</h2>
      <p>
        Security is foundational to UniMeds. We protect patient health information and clinical data with enterprise-grade security measures designed to meet HIPAA, GDPR, and SOC 2 requirements.
      </p>

      <h2>Encryption</h2>
      <ul>
        <li><strong>In transit:</strong> All data is encrypted using TLS 1.3 between clients and our servers</li>
        <li><strong>At rest:</strong> Patient records and sensitive data are encrypted using AES-256</li>
        <li><strong>End-to-end:</strong> Critical health records are encrypted before they leave your device</li>
      </ul>

      <h2>Access Controls</h2>
      <ul>
        <li>Role-based access control (RBAC) ensures users only access data relevant to their role</li>
        <li>Multi-factor authentication (MFA) support for all accounts</li>
        <li>Session management with automatic timeout and concurrent session limits</li>
        <li>IP-based access restrictions available for clinic administrators</li>
      </ul>

      <h2>Infrastructure</h2>
      <ul>
        <li>Hosted on SOC 2 Type II compliant cloud infrastructure</li>
        <li>Automated security scanning and vulnerability assessments</li>
        <li>Regular penetration testing by independent security firms</li>
        <li>DDoS protection and Web Application Firewall (WAF)</li>
      </ul>

      <h2>Audit &amp; Compliance</h2>
      <ul>
        <li>Comprehensive audit logging for all data access and modifications</li>
        <li>Immutable audit trails for compliance reporting</li>
        <li>Regular third-party security audits</li>
        <li>HIPAA Business Associate Agreement (BAA) available</li>
      </ul>

      <h2>Data Backup &amp; Recovery</h2>
      <ul>
        <li>Automated daily backups with 30-day retention</li>
        <li>Geographic redundancy across multiple data centers</li>
        <li>Disaster recovery plan with &lt;4 hour RPO and &lt;1 hour RTO</li>
        <li>Regular backup restoration testing</li>
      </ul>

      <h2>Incident Response</h2>
      <p>
        We maintain a comprehensive incident response plan. In the event of a security incident, we will notify affected users within 72 hours in accordance with applicable regulations.
      </p>

      <h2>Reporting Vulnerabilities</h2>
      <p>
        We welcome responsible disclosure of security vulnerabilities. If you discover a security issue, please report it to security@unimeds.com. We will acknowledge receipt within 24 hours and provide regular updates on the resolution.
      </p>
    </LegalLayout>
  );
}
