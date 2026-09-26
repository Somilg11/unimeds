import type { Metadata } from 'next';
import Link from 'next/link';
import { CloudOff, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageContainer, SiteShell } from '@/components/landing/site-shell';
import { DirectoryFilters } from '@/components/landing/directory-filters';
import { DoctorCard } from '@/components/landing/doctor-card';
import { PageLinks } from '@/components/landing/page-links';
import { PublicNotice } from '@/components/landing/section';
import {
  first,
  toQuery,
  tryPublic,
  type Paged,
  type PublicDoctor,
  type SearchParams,
  type Specialization,
} from '@/components/landing/public-data';

export const metadata: Metadata = {
  title: 'Find a doctor',
  description: 'Search doctors by name, specialization or city and book an appointment online.',
  alternates: { canonical: '/doctors' },
};

/** Current filters with `specialization` swapped (page reset). */
function specHref(sp: SearchParams, spec: string | null) {
  const q = new URLSearchParams();
  for (const k of ['q', 'city', 'lat', 'lng']) {
    const v = first(sp[k]).trim();
    if (v) q.set(k, v);
  }
  if (spec) q.set('specialization', spec);
  const s = q.toString();
  return s ? `/doctors?${s}` : '/doctors';
}

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);
  const hasLocation = Boolean(first(sp.lat) && first(sp.lng));
  const activeSpec = first(sp.specialization);

  const [result, specs] = await Promise.all([
    tryPublic<Paged<PublicDoctor>>(
      `/public/doctors${toQuery(sp, ['q', 'specialization', 'city', 'lat', 'lng'], { page: page > 1 ? String(page) : '' })}`
    ),
    tryPublic<{ items: Specialization[] }>('/public/specializations'),
  ]);

  const filterKey = toQuery(sp, ['q', 'specialization', 'city', 'lat', 'lng']);
  const specItems = specs?.items ?? [];
  const chipClass = (active: boolean) =>
    cn(
      'inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors',
      active ? 'bg-secondary text-secondary-foreground' : 'bg-card hover:bg-accent hover:text-accent-foreground'
    );

  return (
    <SiteShell>
      <PageContainer>
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">Find a doctor</h1>
          <p className="text-muted-foreground">Search by name, specialization or city, then book a time that suits you.</p>
        </header>

        <DirectoryFilters
          key={filterKey}
          values={{ q: first(sp.q), city: first(sp.city), specialization: activeSpec, near: hasLocation }}
          searchLabel="Doctor name or keyword"
          searchPlaceholder="e.g. Rao, heart, skin"
        />

        {specItems.length > 0 && (
          <nav aria-label="Filter by specialization" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={specHref(sp, null)} aria-current={!activeSpec ? 'page' : undefined} className={chipClass(!activeSpec)}>
              All
            </Link>
            {specItems.map((s) => (
              <Link
                key={s.name}
                href={specHref(sp, s.name)}
                aria-current={activeSpec === s.name ? 'page' : undefined}
                className={chipClass(activeSpec === s.name)}
              >
                {s.name}
              </Link>
            ))}
          </nav>
        )}

        <section aria-label="Results" className="mt-8">
          {!result ? (
            <PublicNotice
              tone="error"
              icon={CloudOff}
              title="We couldn’t load doctors right now"
              description="Please try again in a moment."
            />
          ) : result.items.length === 0 ? (
            <PublicNotice
              icon={SearchX}
              title="No doctors match your search"
              description="Try a different name, specialization or city, or clear the filters."
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{result.total}</span> doctor{result.total === 1 ? '' : 's'}
                {hasLocation && ' · sorted by distance'}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((d) => (
                  <li key={d.id}>
                    <DoctorCard doctor={d} />
                  </li>
                ))}
              </ul>
              <PageLinks basePath="/doctors" searchParams={sp} page={result.page} totalPages={result.totalPages} total={result.total} />
            </>
          )}
        </section>
      </PageContainer>
    </SiteShell>
  );
}
