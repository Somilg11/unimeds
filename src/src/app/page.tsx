import type { Metadata } from 'next';
import Link from 'next/link';
import Form from 'next/form';
import { ArrowRight, BarChart3, CalendarCheck, Check, FileText, MapPin, Search, UserPlus, Users } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { SpecialityMenu } from '@/components/landing/speciality-menu';
import { WhyChooseMe } from '@/components/landing/why-choose-me';
import { Faq } from '@/components/landing/faq';
import { FAQ_ITEMS } from '@/components/landing/faq-items';
import { Eyebrow, IconCircle, ON_BRAND_OUTLINE, ON_BRAND_SOLID, SplitHeading } from '@/components/landing/section';
import { tryPublic, type PublicStats, type Specialization } from '@/components/landing/public-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JsonLd } from '@/components/seo/json-ld';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/site';

const STEPS = [
  { icon: Search, title: 'Find a doctor', body: 'Search by name, specialization or city, or look for clinics near you.' },
  { icon: CalendarCheck, title: 'Pick a time', body: 'Choose from the doctor’s open slots at the clinic you prefer.' },
  { icon: UserPlus, title: 'Confirm and go', body: 'Sign in to confirm. You’ll be notified when the clinic confirms or suggests a new time.' },
];

const CLINIC_POINTS = [
  { icon: CalendarCheck, label: 'Online booking with your own rules' },
  { icon: Users, label: 'Weekly schedules for every doctor' },
  { icon: FileText, label: 'Records shared per visit, privately' },
  { icon: BarChart3, label: 'Analytics and an audit trail' },
];

const noun = (n: number, one: string, many: string) => (n === 1 ? one : many);

function HeroSearch({ specs }: { specs: Specialization[] }) {
  return (
    <div className="rounded-3xl bg-card p-5 text-card-foreground sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">Find a doctor</h2>
      <p className="mt-1 text-sm text-muted-foreground">See real open times and book online.</p>
      <Form action="/doctors" role="search" className="mt-5 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="hero-q">Name or specialization</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="hero-q" name="q" placeholder="e.g. Rao, heart, skin" className="h-12 rounded-full pl-10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-city">City</Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="hero-city" name="city" placeholder="Any city" className="h-12 rounded-full pl-10" />
          </div>
        </div>
        <Button type="submit" variant="secondary" size="lg" className="h-12 w-full">
          <Search /> Search doctors
        </Button>
      </Form>
      {specs.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">Popular specialties</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {specs.slice(0, 4).map((s) => (
              <li key={s.name}>
                <Link
                  href={`/doctors?specialization=${encodeURIComponent(s.name)}`}
                  className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Organization + sitelinks search box for Google
const SITE_JSON_LD = [
  { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: absoluteUrl('/icon-512.png') },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/doctors?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  },
];

export default async function Home() {
  const [stats, specs] = await Promise.all([
    tryPublic<PublicStats>('/public/stats'),
    tryPublic<{ items: Specialization[] }>('/public/specializations'),
  ]);
  const showStats = stats && stats.doctors > 0;
  const specItems = specs?.items ?? [];

  const hero = (
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      <div className="grid gap-10 pt-12 pb-10 sm:pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-14 lg:pt-20 lg:pb-14">
        <div>
          <Eyebrow inverted>Doctors and clinics, in one place</Eyebrow>
          <h1 className="mt-6 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your health, handled with care
          </h1>
          <p className="mt-5 max-w-lg text-base text-brand-foreground/80 sm:text-lg">
            Find the right doctor, see their real availability and book a visit at a clinic near you. Keep your reports together and share
            them with the clinics you visit.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" className={ON_BRAND_SOLID}>
              <Link href="/doctors">
                Find a doctor <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={ON_BRAND_OUTLINE}>
              <Link href="/clinics">Browse clinics</Link>
            </Button>
          </div>
        </div>
        <HeroSearch specs={specItems} />
      </div>

      {showStats && (
        <dl className="grid grid-cols-3 gap-4 border-t border-white/20 py-8">
          {[
            { label: noun(stats.doctors, 'Doctor', 'Doctors'), value: stats.doctors },
            { label: noun(stats.clinics, 'Clinic', 'Clinics'), value: stats.clinics },
            { label: noun(stats.cities, 'City', 'Cities'), value: stats.cities },
          ].map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-brand-foreground/75">{s.label}</dt>
              <dd className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{s.value.toLocaleString('en-IN')}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );

  return (
    <SiteShell hero={hero}>
      <JsonLd data={SITE_JSON_LD} />
      <WhyChooseMe />

      <SpecialityMenu items={specItems} />

      {/* How it works */}
      <section aria-labelledby="how-h" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <SplitHeading
          id="how-h"
          eyebrow="How it works"
          title="Book a visit in three steps"
          description="No phone queues. Pick the doctor and clinic that suit you, choose a free time and you’re done."
        />
        <ol className="mt-10 grid gap-3 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col rounded-3xl bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <IconCircle icon={s.icon} />
              </div>
              <h3 className="mt-6 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* For clinics */}
      <section aria-labelledby="clinics-h" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-8 rounded-[2rem] bg-card p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <Eyebrow className="bg-muted">For clinics</Eyebrow>
            <h2 id="clinics-h" className="mt-4 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              Run your practice on Unimeds
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Online booking, doctor schedules, shared records and a clear view of how your clinic is doing — in one place.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="h-12 px-6">
                <Link href="/for-clinics">
                  Learn more <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {CLINIC_POINTS.map((p) => (
              <li key={p.label} className="flex items-center gap-3 rounded-3xl bg-muted p-3 pr-4 text-sm font-medium">
                <IconCircle icon={p.icon} className="size-10 bg-card text-foreground" />
                <span className="flex-1">{p.label}</span>
                <Check className="size-4 text-primary" aria-hidden />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-h" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div className="space-y-4">
            <Eyebrow>FAQ</Eyebrow>
            <h2 id="faq-h" className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              The basics of booking, accounts and your records. Can’t find what you need? Our support page has more.
            </p>
            <Button asChild variant="secondary" size="lg" className="h-12 px-6">
              <Link href="/support">
                Visit support <ArrowRight />
              </Link>
            </Button>
          </div>
          <Faq items={FAQ_ITEMS.slice(0, 5)} tone="card" />
        </div>
      </section>

      {/* CTA band */}
      <section aria-labelledby="cta-h" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:pb-20">
        <div className="flex flex-col gap-8 rounded-[2rem] bg-brand px-6 py-12 text-brand-foreground sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 id="cta-h" className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              Start your health journey today
            </h2>
            <p className="mt-3 text-brand-foreground/80">
              Create a free patient account to book appointments and keep your records together.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" className={ON_BRAND_SOLID}>
              <Link href="/signup">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={ON_BRAND_OUTLINE}>
              <Link href="/doctors">Find a doctor</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
