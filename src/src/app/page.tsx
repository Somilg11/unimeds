import Link from 'next/link';
import Form from 'next/form';
import { ArrowRight, Building2, CalendarCheck, Search, UserPlus } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { SpecialityMenu } from '@/components/landing/speciality-menu';
import { WhyChooseMe } from '@/components/landing/why-choose-me';
import { tryPublic, type PublicStats, type Specialization } from '@/components/landing/public-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STEPS = [
  { icon: Search, title: 'Find a doctor', body: 'Search by name, specialization or city, or look for clinics near you.' },
  { icon: CalendarCheck, title: 'Pick a time', body: 'Choose from the doctor’s open slots at the clinic you prefer.' },
  { icon: UserPlus, title: 'Confirm and go', body: 'Sign in to confirm. You’ll be notified when the clinic confirms or suggests a new time.' },
];

const noun = (n: number, one: string, many: string) => (n === 1 ? one : many);

export default async function Home() {
  const [stats, specs] = await Promise.all([
    tryPublic<PublicStats>('/public/stats'),
    tryPublic<{ items: Specialization[] }>('/public/specializations'),
  ]);
  const showStats = stats && stats.doctors > 0;

  return (
    <SiteShell>
      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:pb-24 lg:pt-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Book the right doctor, at a clinic near you.</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Search doctors, see their real availability and book online. Keep your medical records in one place and share them with
              the clinics you visit.
            </p>
            <Form action="/doctors" role="search" className="mt-8 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="hero-q" className="sr-only">
                Search doctors by name or specialization
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="hero-q" name="q" placeholder="Doctor name or specialization" className="h-11 pl-9" />
              </div>
              <Button type="submit" size="lg" className="h-11">
                Search doctors
              </Button>
            </Form>
            <p className="mt-3 text-sm text-muted-foreground">
              Or{' '}
              <Link href="/clinics" className="font-medium text-primary hover:underline">
                browse clinics
              </Link>
              .
            </p>
          </div>

          {showStats && (
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t pt-8">
              {[
                { label: noun(stats.doctors, 'Doctor', 'Doctors'), value: stats.doctors },
                { label: noun(stats.clinics, 'Clinic', 'Clinics'), value: stats.clinics },
                { label: noun(stats.cities, 'City', 'Cities'), value: stats.cities },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="text-3xl font-semibold tracking-tight">{s.value.toLocaleString('en-IN')}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <SpecialityMenu items={specs?.items ?? []} />

      {/* How it works */}
      <section aria-labelledby="how-h" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="how-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <WhyChooseMe />

      {/* For clinics */}
      <section aria-labelledby="clinics-h" className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Building2 className="size-4" /> For clinics
            </p>
            <h2 id="clinics-h" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Run your practice on Unimeds
            </h2>
            <p className="mt-2 text-muted-foreground">
              Online booking, doctor schedules, shared records and a clear view of how your clinic is doing — in one place.
            </p>
          </div>
          <Button asChild size="lg" variant="outline">
            <Link href="/for-clinics">
              Learn more <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready to book your next visit?</h2>
          <p className="mt-2 max-w-md text-primary-foreground/80">Create a patient account to book appointments and keep your records together.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href="/doctors">Find a doctor</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/signup">Create an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
