import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, CalendarCheck, FileText, ScrollText, ShieldCheck, Users } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'For clinics',
  description: 'Online booking, team schedules, shared records, analytics and an audit trail for your clinic.',
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
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 lg:pt-24">
        <p className="text-sm font-medium text-primary">Unimeds for clinics</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Bookings, schedules and patient records for your practice, in one place.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Unimeds gives your clinic a public booking page, a shared calendar for your doctors and a secure way to exchange records with
          patients.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/contact">Talk to us</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/clinics">See clinics on Unimeds</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="features-h" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="features-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            What’s included
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-xl border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="start-h" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="start-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Getting started
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s} className="rounded-xl border bg-card p-6">
                <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
                <p className="mt-2">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Want to bring your clinic onto Unimeds?</h2>
          <p className="mt-2 max-w-md text-primary-foreground/80">Tell us a little about your practice and we’ll get back to you.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link href="/contact">Talk to us</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
