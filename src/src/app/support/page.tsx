import { InfoPageLayout } from '@/components/landing/info-page-layout';

export default function SupportPage() {
  return (
    <InfoPageLayout title="Support">
      <div className="space-y-10">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-4 tracking-tight">Help Center</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
            Find answers to common questions, step-by-step guides, and troubleshooting tips for all UniMeds portals.
          </p>
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {[
              { q: 'How do I sign in to the Patient Portal?', a: 'Click "Patient Portal" from the homepage, then use the "Sign in with Google" button. You will be redirected to your dashboard after authentication.' },
              { q: 'How do doctors log in?', a: 'Doctors use their Auth ID provided by the clinic administrator. Enter it on the Doctor Dashboard login page and click Sign In.' },
              { q: 'I forgot my admin password', a: 'Contact your system administrator to reset your credentials. Admin accounts are managed through the Super Admin console.' },
              { q: 'How do I upload medical records?', a: 'Navigate to the Records section in your Patient Portal. You can drag and drop files or click the upload button to add documents.' },
              { q: 'Is my data secure?', a: 'Yes. All data is encrypted end-to-end using AES-256 at rest and TLS 1.3 in transit. We are HIPAA compliant and undergo regular security audits.' },
            ].map((item) => (
              <div key={item.q} className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors">
                <p className="text-[14.5px] font-medium text-gray-900 mb-1.5">{item.q}</p>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-4 tracking-tight">Contact Support</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
            Can&apos;t find what you&apos;re looking for? Reach out to our support team.
          </p>
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <div className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors">
              <p className="text-[14.5px] font-medium text-gray-900 mb-1">Email</p>
              <p className="text-[13.5px] text-primary">support@unimeds.com</p>
            </div>
            <div className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors">
              <p className="text-[14.5px] font-medium text-gray-900 mb-1">Response Time</p>
              <p className="text-[13.5px] text-gray-500">We aim to respond within 24 hours during business days.</p>
            </div>
            <div className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors">
              <p className="text-[14.5px] font-medium text-gray-900 mb-1">Hours</p>
              <p className="text-[13.5px] text-gray-500">Monday &ndash; Friday, 9:00 AM &ndash; 6:00 PM EST</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-4 tracking-tight">System Status</h2>
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[14.5px] font-medium text-gray-900">All Systems Operational</span>
            </div>
            <p className="text-[14px] text-gray-600 leading-relaxed">
              UniMeds systems are currently running smoothly. If you experience any issues, please check back here or contact support.
            </p>
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
}
