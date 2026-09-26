import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { InfoPageLayout } from '@/components/landing/info-page-layout';

export const metadata: Metadata = { title: 'Support', description: 'Answers to common questions about Unimeds.' };

const FAQ: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'How do I book an appointment?',
    a: (
      <>
        <Link href="/doctors">Find a doctor</Link>, open their profile and choose “Book appointment” at the clinic you want. Pick a free
        time, then sign in or create an account to confirm.
      </>
    ),
  },
  {
    q: 'Why is my appointment “pending”?',
    a: 'Some clinics review bookings before confirming them. You’ll get a notification when the clinic confirms, suggests a different time, or cancels.',
  },
  {
    q: 'How do I cancel or reschedule?',
    a: 'Open the appointment from your patient dashboard. Each clinic sets how close to the visit you can still cancel online — it’s shown on the clinic’s page. After that, contact the clinic directly.',
  },
  {
    q: 'I’m a doctor or clinic admin. How do I get an account?',
    a: 'Doctor and clinic admin accounts are created by invitation. Ask your clinic administrator to invite your email address, then follow the link in the invitation email.',
  },
  {
    q: 'I forgot my password.',
    a: (
      <>
        Use <Link href="/forgot-password">Forgot password</Link> on the sign-in page and we’ll email you a reset link.
      </>
    ),
  },
  {
    q: 'How do I share records with my doctor?',
    a: 'Upload the file in the Records section of your patient dashboard and attach it to the relevant appointment. It is then visible to that clinic and doctor.',
  },
  {
    q: 'Is my data secure?',
    a: (
      <>
        Traffic is encrypted over HTTPS, medical files are stored privately and only served to people allowed to see them, and access is
        role-based. See <Link href="/legal/security">Security</Link> for details.
      </>
    ),
  },
  {
    q: 'Can I download or delete my data?',
    a: 'Yes. Patients can download a copy of their data and delete their account from their profile settings (once there are no upcoming appointments).',
  },
];

export default function SupportPage() {
  return (
    <InfoPageLayout title="Support" description="Answers to common questions.">
      <div className="divide-y rounded-xl border bg-card [&_a]:font-medium [&_a]:text-primary hover:[&_a]:underline">
        {FAQ.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>

      <section className="mt-10 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Still need help?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Email us and include the address you use to sign in. Please don’t send medical details by email.
        </p>
        <a
          href="mailto:support@unimeds.app?subject=Support%20request"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Mail className="size-4" /> support@unimeds.app
        </a>
      </section>
    </InfoPageLayout>
  );
}
