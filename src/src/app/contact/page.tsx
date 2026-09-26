import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, LifeBuoy, Mail, MessageCircle } from 'lucide-react';
import { InfoPageLayout } from '@/components/landing/info-page-layout';
import { IconCircle } from '@/components/landing/section';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Unimeds team.',
  alternates: { canonical: '/contact' },
};

const EMAIL = 'support@unimeds.app';

const TOPICS = [
  {
    icon: Building2,
    title: 'Bring your clinic onto Unimeds',
    body: 'Tell us about your practice — number of doctors, locations and how you take bookings today.',
    subject: 'Clinic onboarding',
  },
  {
    icon: LifeBuoy,
    title: 'Help with your account or a booking',
    body: 'Include the email you signed up with. Please don’t send medical details by email.',
    subject: 'Account help',
  },
  { icon: MessageCircle, title: 'Anything else', body: 'Feedback, partnerships or press.', subject: 'General enquiry' },
];

export default function ContactPage() {
  return (
    <InfoPageLayout eyebrow="Contact" title="Talk to the Unimeds team" description="Email is the best way to reach us.">
      <ul className="grid gap-3">
        {TOPICS.map((t) => (
          <li key={t.title} className="flex flex-col gap-4 rounded-3xl bg-card p-5 sm:flex-row sm:items-center sm:p-6">
            <IconCircle icon={t.icon} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{t.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
            </div>
            <Button asChild variant="outline" size="lg" className="h-11 shrink-0">
              <a href={`mailto:${EMAIL}?subject=${encodeURIComponent(t.subject)}`} aria-label={`Email ${EMAIL} about: ${t.title}`}>
                <Mail /> Email us
              </a>
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
        Write to us at{' '}
        <a href={`mailto:${EMAIL}`} className="font-medium text-foreground hover:underline">
          {EMAIL}
        </a>
        . Looking for answers to common questions? Visit{' '}
        <Link href="/support" className="font-medium text-primary hover:underline">
          Support
        </Link>
        . For a medical emergency, contact your local emergency services.
      </p>
    </InfoPageLayout>
  );
}
