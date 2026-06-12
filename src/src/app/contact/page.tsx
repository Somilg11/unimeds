import { InfoPageLayout } from '@/components/landing/info-page-layout';

export default function ContactPage() {
  return (
    <InfoPageLayout title="Contact">
      <div className="space-y-10">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Get in Touch</h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed mb-6">
            Whether you&apos;re interested in a demo, have a partnership inquiry, or want to learn more about UniMeds, we&apos;d love to hear from you.
          </p>
          <div className="border border-neutral-200 divide-y divide-neutral-200">
            <div className="p-5">
              <p className="text-[14px] font-medium text-neutral-900 mb-1">General Inquiries</p>
              <p className="text-[13px] text-neutral-500">hello@unimeds.com</p>
            </div>
            <div className="p-5">
              <p className="text-[14px] font-medium text-neutral-900 mb-1">Sales &amp; Demos</p>
              <p className="text-[13px] text-neutral-500">sales@unimeds.com</p>
            </div>
            <div className="p-5">
              <p className="text-[14px] font-medium text-neutral-900 mb-1">Partnerships</p>
              <p className="text-[13px] text-neutral-500">partners@unimeds.com</p>
            </div>
            <div className="p-5">
              <p className="text-[14px] font-medium text-neutral-900 mb-1">Press</p>
              <p className="text-[13px] text-neutral-500">press@unimeds.com</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Office</h2>
          <div className="border border-neutral-200 p-5">
            <p className="text-[14px] font-medium text-neutral-900 mb-1">UniMeds Inc.</p>
            <p className="text-[13px] text-neutral-500 leading-relaxed">
              123 Healthcare Blvd, Suite 400<br />
              San Francisco, CA 94102<br />
              United States
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Follow Us</h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed">
            Stay connected with UniMeds on social media for the latest updates, healthcare insights, and product news.
          </p>
          <div className="mt-4 flex gap-4">
            <span className="text-[13px] text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors">LinkedIn</span>
            <span className="text-[13px] text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors">YouTube</span>
            <span className="text-[13px] text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors">Discord</span>
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
}
