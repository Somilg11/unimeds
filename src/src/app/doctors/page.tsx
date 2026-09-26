import type { Metadata } from 'next';
import { SearchX, Stethoscope } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { DirectoryFilters } from '@/components/landing/directory-filters';
import { DoctorCard } from '@/components/landing/doctor-card';
import { PageLinks } from '@/components/landing/page-links';
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
};

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);
  const hasLocation = Boolean(first(sp.lat) && first(sp.lng));

  const [result, specs] = await Promise.all([
    tryPublic<Paged<PublicDoctor>>(
      `/public/doctors${toQuery(sp, ['q', 'specialization', 'city', 'lat', 'lng'], { page: page > 1 ? String(page) : '' })}`
    ),
    tryPublic<{ items: Specialization[] }>('/public/specializations'),
  ]);

  const filterKey = toQuery(sp, ['q', 'specialization', 'city', 'lat', 'lng']);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Find a doctor</h1>
          <p className="mt-2 text-muted-foreground">Search by name, specialization or city, then book a time that suits you.</p>
        </header>

        <DirectoryFilters
          key={filterKey}
          values={{ q: first(sp.q), city: first(sp.city), specialization: first(sp.specialization), near: hasLocation }}
          specializations={(specs?.items ?? []).map((s) => s.name)}
          searchLabel="Doctor name or keyword"
          searchPlaceholder="e.g. Rao, heart, skin"
        />

        <section aria-label="Results" className="mt-8">
          {!result ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center text-sm text-destructive">
              We couldn&apos;t load doctors right now. Please try again in a moment.
            </div>
          ) : result.items.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
              <SearchX className="mb-3 size-8 text-muted-foreground" />
              <p className="font-medium">No doctors match your search</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try a different name, specialization or city, or clear the filters.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Stethoscope className="size-4" />
                {result.total} doctor{result.total === 1 ? '' : 's'}
                {hasLocation && ' sorted by distance'}
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </SiteShell>
  );
}
