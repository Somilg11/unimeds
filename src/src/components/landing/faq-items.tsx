import Link from 'next/link';
import type { FaqItem } from '@/components/landing/faq';

/** Answers reflect how the product works today. Shared by the landing page and /support. */
export const FAQ_ITEMS: FaqItem[] = [
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
