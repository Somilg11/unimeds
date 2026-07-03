import { InfoPageLayout } from '@/components/landing/info-page-layout';

export default function ContactPage() {
  return (
    <InfoPageLayout title="Contact">
      <div className="space-y-8">
        
        <div className="bg-white rounded-[2rem] border border-[#d4e1f7] p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-[#0B0A0A] mb-4">Get in Touch</h2>
          <p className="text-[14px] text-gray-500 leading-relaxed mb-8 max-w-2xl">
            Whether you&apos;re interested in a demo, have a partnership inquiry, or want to learn more about UniMeds, we&apos;d love to hear from you.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#F5F5F7] rounded-[1.5rem] p-6 border border-gray-100 hover:border-[#d4e1f7] transition-colors">
              <p className="text-[14px] font-bold text-[#0B0A0A] mb-2">General Inquiries</p>
              <p className="text-[13px] text-[#246AFE] font-medium">hello@unimeds.com</p>
            </div>
            <div className="bg-[#F5F5F7] rounded-[1.5rem] p-6 border border-gray-100 hover:border-[#d4e1f7] transition-colors">
              <p className="text-[14px] font-bold text-[#0B0A0A] mb-2">Sales &amp; Demos</p>
              <p className="text-[13px] text-[#246AFE] font-medium">sales@unimeds.com</p>
            </div>
            <div className="bg-[#F5F5F7] rounded-[1.5rem] p-6 border border-gray-100 hover:border-[#d4e1f7] transition-colors">
              <p className="text-[14px] font-bold text-[#0B0A0A] mb-2">Partnerships</p>
              <p className="text-[13px] text-[#246AFE] font-medium">partners@unimeds.com</p>
            </div>
            <div className="bg-[#F5F5F7] rounded-[1.5rem] p-6 border border-gray-100 hover:border-[#d4e1f7] transition-colors">
              <p className="text-[14px] font-bold text-[#0B0A0A] mb-2">Press</p>
              <p className="text-[13px] text-[#246AFE] font-medium">press@unimeds.com</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2rem] border border-[#d4e1f7] p-8 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0B0A0A] mb-4">Office</h2>
            <div className="bg-[#EBF0FE]/50 rounded-[1.5rem] p-6 border border-[#d4e1f7]">
              <p className="text-[15px] font-black text-[#0B0A0A] mb-2">UniMeds Inc.</p>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                123 Healthcare Blvd, Suite 400<br />
                San Francisco, CA 94102<br />
                United States
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-[#d4e1f7] p-8 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-[#0B0A0A] mb-4">Follow Us</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
              Stay connected with UniMeds on social media for the latest updates, healthcare insights, and product news.
            </p>
            <div className="flex flex-wrap gap-3">
              {['LinkedIn', 'YouTube', 'Discord'].map((social) => (
                <div key={social} className="px-4 py-2 bg-[#F5F5F7] rounded-full text-[12px] font-bold text-[#0B0A0A] border border-gray-200 hover:bg-[#EBF0FE] hover:text-[#246AFE] hover:border-[#d4e1f7] cursor-pointer transition-colors">
                  {social}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
}
