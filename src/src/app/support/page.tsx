import { InfoPageLayout } from '@/components/landing/info-page-layout';

export default function SupportPage() {
  return (
    <InfoPageLayout title="Support">
      <div className="space-y-8">
        
        <div className="bg-white rounded-[2rem] border border-[#d4e1f7] p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-[#0B0A0A] mb-4">Help Center</h2>
          <p className="text-[14px] text-gray-500 leading-relaxed mb-8 max-w-2xl">
            Find answers to common questions, step-by-step guides, and troubleshooting tips for all UniMeds portals.
          </p>
          
          <div className="flex flex-col gap-4">
            {[
              { q: 'How do I sign in to the Patient Portal?', a: 'Click "Patient Portal" from the homepage, then use the "Sign in with Google" button. You will be redirected to your dashboard after authentication.' },
              { q: 'How do doctors log in?', a: 'Doctors use their Auth ID provided by the clinic administrator. Enter it on the Doctor Dashboard login page and click Sign In.' },
              { q: 'I forgot my admin password', a: 'Contact your system administrator to reset your credentials. Admin accounts are managed through the Super Admin console.' },
              { q: 'How do I upload medical records?', a: 'Navigate to the Records section in your Patient Portal. You can drag and drop files or click the upload button to add documents.' },
              { q: 'Is my data secure?', a: 'Yes. All data is encrypted end-to-end using AES-256 at rest and TLS 1.3 in transit. We are HIPAA compliant and undergo regular security audits.' },
            ].map((item) => (
              <div key={item.q} className="bg-[#F5F5F7] rounded-[1.5rem] p-6 border border-gray-100 hover:border-[#d4e1f7] transition-colors">
                <p className="text-[15px] font-bold text-[#0B0A0A] mb-2">{item.q}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2rem] border border-[#d4e1f7] p-8 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0B0A0A] mb-4">Contact Support</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
              Can&apos;t find what you&apos;re looking for? Reach out to our support team.
            </p>
            
            <div className="space-y-4">
              <div className="bg-[#EBF0FE]/50 rounded-[1.5rem] p-5 border border-[#d4e1f7]">
                <p className="text-[14px] font-bold text-[#0B0A0A] mb-1">Email</p>
                <p className="text-[13px] text-[#246AFE] font-medium">support@unimeds.com</p>
              </div>
              <div className="bg-[#F5F5F7] rounded-[1.5rem] p-5 border border-gray-100">
                <p className="text-[14px] font-bold text-[#0B0A0A] mb-1">Response Time</p>
                <p className="text-[13px] text-gray-600">Within 24 hours during business days.</p>
              </div>
              <div className="bg-[#F5F5F7] rounded-[1.5rem] p-5 border border-gray-100">
                <p className="text-[14px] font-bold text-[#0B0A0A] mb-1">Hours</p>
                <p className="text-[13px] text-gray-600">Monday &ndash; Friday, 9:00 AM &ndash; 6:00 PM EST</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-[#d4e1f7] p-8 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#EBF0FE] border border-[#d4e1f7] flex items-center justify-center mb-6 shadow-sm">
               <div className="w-3 h-3 rounded-full bg-[#0071E3] animate-pulse" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#0B0A0A] mb-3">System Status</h2>
            <p className="text-[14px] text-gray-500 leading-relaxed max-w-sm">
              All UniMeds systems are currently operational. If you experience any issues, please check our status page or contact support.
            </p>
            <button className="mt-6 px-6 py-2.5 bg-white border border-[#d4e1f7] text-[#246AFE] text-[13px] font-bold rounded-full hover:bg-[#EBF0FE] transition-colors shadow-sm">
              View Status Page
            </button>
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
}
