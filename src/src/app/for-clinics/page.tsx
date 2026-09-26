import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarCheck, FileText, ScrollText, ShieldCheck, Users } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { Eyebrow, IconCircle, ON_BRAND_OUTLINE, ON_BRAND_SOLID, SplitHeading } from '@/components/landing/section';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'For clinics',
  description: 'Online booking, team schedules, shared records, analytics and an audit trail for your clinic.',
  alternates: { canonical: '/for-clinics' },
};

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Online booking',
    body: 'Patients find your doctors and book open slots themselves. Set slot length, how far ahead people can book, your cancellation window, and whether bookings confirm automatically. Front-desk staff can book walk-ins and phone calls too.',
  },
  {
    icon: Users,
    title: 'Team & schedules',
    body: 'Invite doctors and administrators by email. Each doctor keeps a weekly schedule per clinic, in your clinic’s time zone. Deactivate a member without losing their history.',
  },
  {
    icon: FileText,
    title: 'Records sharing',
    body: 'Patients attach reports and prescriptions to a visit, which shares them with that clinic and doctor. Doctors can add records for their patients. Files are stored privately and served only after an access check.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    body: 'Monthly appointment trends, no-show and cancellation rates, new patients and per-doctor performance, from your own booking data.',
  },
  {
    icon: ScrollText,
    title: 'Audit trail',
    body: 'Important actions — bookings, cancellations, team changes, record uploads — are written to an append-only audit log your admins can review.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    body: 'Patients, doctors and clinic admins each see only what their role and clinic membership allow. Every request is checked on the server.',
  },
];

const STEPS = [
  'Tell us about your clinic and we’ll set up your account.',
  'Add your details, booking policy and invite your doctors.',
  'Doctors set their weekly hours, and patients can start booking.',
];

export default function ForClinicsPage() {
  const hero = (
    <div className="mx-auto max-w-6xl px-4 pt-12 pb-12 sm:px-8 sm:pt-16 lg:pt-20 lg:pb-16">
      <Eyebrow inverted>Unimeds for clinics</Eyebrow>
      <h1 className="mt-6 max-w-3xl text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Run your practice, not your paperwork
      </h1>
      <p className="mt-5 max-w-2xl text-base text-brand-foreground/80 sm:text-lg">
        Unimeds gives your clinic a public booking page, a shared calendar for your doctors and a secure way to exchange records with
        patients — bookings, schedules and records in one place.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className={ON_BRAND_SOLID}>
          <Link href="/contact">
            Talk to us <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className={ON_BRAND_OUTLINE}>
          <Link href="/clinics">See clinics on Unimeds</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <SiteShell hero={hero}>
      <section aria-labelledby="features-h" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <SplitHeading
          id="features-h"
          eyebrow="What’s included"
          title="Everything your front desk needs"
          description="From the first booking to the follow-up report, your team and your patients work from the same, up-to-date information."
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex flex-col rounded-3xl bg-card p-6">
              <IconCircle icon={f.icon} />
              <h3 className="mt-6 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="start-h" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:pb-20">
        <SplitHeading id="start-h" eyebrow="Getting started" title="Live in three steps" />
        <ol className="mt-10 grid gap-3 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s} className="rounded-3xl bg-card p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-6 text-sm leading-relaxed font-medium">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="cta-h" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:pb-20">
        <div className="flex flex-col gap-6 rounded-[2rem] bg-card px-6 py-10 sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 id="cta-h" className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              Bring your clinic onto Unimeds
            </h2>
            <p className="mt-3 text-muted-foreground">Tell us a little about your practice and we’ll get back to you.</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="h-12 px-6">
            <Link href="/contact">
              Talk to us <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
