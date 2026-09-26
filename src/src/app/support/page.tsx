import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { InfoPageLayout } from '@/components/landing/info-page-layout';
import { Faq } from '@/components/landing/faq';
import { FAQ_ITEMS } from '@/components/landing/faq-items';
import { IconCircle } from '@/components/landing/section';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Answers to common questions about Unimeds.',
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return (
    <InfoPageLayout eyebrow="Support" title="How can we help?" description="Answers to common questions about booking, accounts and records.">
      <Faq items={FAQ_ITEMS} tone="card" />

      <section aria-labelledby="help-h" className="mt-10 flex flex-col gap-4 rounded-3xl bg-card p-6 sm:flex-row sm:items-center">
        <IconCircle icon={Mail} />
        <div className="min-w-0 flex-1">
          <h2 id="help-h" className="font-semibold">
            Still need help?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Email us and include the address you use to sign in. Please don’t send medical details by email.
          </p>
        </div>
        <Button asChild variant="secondary" size="lg" className="h-11 shrink-0">
          <a href="mailto:support@unimeds.app?subject=Support%20request">support@unimeds.app</a>
        </Button>
      </section>
    </InfoPageLayout>
  );
}
