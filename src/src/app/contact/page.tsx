import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { InfoPageLayout } from '@/components/landing/info-page-layout';

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with the Unimeds team.' };

const EMAIL = 'support@unimeds.app';

const TOPICS = [
  { title: 'Bring your clinic onto Unimeds', body: 'Tell us about your practice — number of doctors, locations and how you take bookings today.', subject: 'Clinic onboarding' },
  { title: 'Help with your account or a booking', body: 'Include the email you signed up with. Please don’t send medical details by email.', subject: 'Account help' },
  { title: 'Anything else', body: 'Feedback, partnerships or press.', subject: 'General enquiry' },
];

export default function ContactPage() {
  return (
    <InfoPageLayout title="Contact" description="Email is the best way to reach us.">
      <ul className="grid gap-4">
        {TOPICS.map((t) => (
          <li key={t.title} className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">{t.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent(t.subject)}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="size-4" /> Email {EMAIL}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
        Looking for answers to common questions? Visit{' '}
        <Link href="/support" className="font-medium text-primary hover:underline">
          Support
        </Link>
        . For a medical emergency, contact your local emergency services.
      </p>
    </InfoPageLayout>
  );
}
