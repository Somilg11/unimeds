import { InfoPageLayout } from '@/components/landing/info-page-layout';

export default function ContactPage() {
  return (
    <InfoPageLayout title="Contact">
      <div className="space-y-10">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-4 tracking-tight">Get in Touch</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
            Whether you&apos;re interested in a demo, have a partnership inquiry, or want to learn more about UniMeds, we&apos;d love to hear from you.
          </p>
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <div className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors">
              <p className="text-[14.5px] font-medium text-gray-900 mb-1">General Inquiries</p>
              <p className="text-[13.5px] text-primary">hello@unimeds.com</p>
            </div>
            <div className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors">
              <p className="text-[14.5px] font-medium text-gray-900 mb-1">Sales &amp; Demos</p>
              <p className="text-[13.5px] text-primary">sales@unimeds.com</p>
            </div>
            <div className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors">
              <p className="text-[14.5px] font-medium text-gray-900 mb-1">Partnerships</p>
              <p className="text-[13.5px] text-primary">partners@unimeds.com</p>
            </div>
            <div className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors">
              <p className="text-[14.5px] font-medium text-gray-900 mb-1">Press</p>
              <p className="text-[13.5px] text-primary">press@unimeds.com</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-4 tracking-tight">Office</h2>
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 hover-lift">
            <p className="text-[15px] font-semibold text-gray-900 mb-2">UniMeds Inc.</p>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              123 Healthcare Blvd, Suite 400<br />
              San Francisco, CA 94102<br />
              United States
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-4 tracking-tight">Follow Us</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
            Stay connected with UniMeds on social media for the latest updates, healthcare insights, and product news.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="px-5 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm text-[13.5px] font-medium text-gray-700 hover:text-primary hover:border-primary/20 transition-all cursor-pointer hover-lift">LinkedIn</span>
            <span className="px-5 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm text-[13.5px] font-medium text-gray-700 hover:text-primary hover:border-primary/20 transition-all cursor-pointer hover-lift">YouTube</span>
            <span className="px-5 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm text-[13.5px] font-medium text-gray-700 hover:text-primary hover:border-primary/20 transition-all cursor-pointer hover-lift">Discord</span>
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
}
