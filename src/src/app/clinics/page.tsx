import type { Metadata } from 'next';
import { Building2, SearchX } from 'lucide-react';
import { SiteShell } from '@/components/landing/site-shell';
import { DirectoryFilters } from '@/components/landing/directory-filters';
import { ClinicCard } from '@/components/landing/clinic-card';
import { PageLinks } from '@/components/landing/page-links';
import { first, toQuery, tryPublic, type Paged, type PublicClinic, type SearchParams } from '@/components/landing/public-data';

export const metadata: Metadata = {
  title: 'Clinics',
  description: 'Browse clinics on Unimeds and book with their doctors online.',
};

export default async function ClinicsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);
  const hasLocation = Boolean(first(sp.lat) && first(sp.lng));
  const result = await tryPublic<Paged<PublicClinic>>(
    `/public/clinics${toQuery(sp, ['q', 'city', 'lat', 'lng'], { page: page > 1 ? String(page) : '' })}`
  );

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Clinics</h1>
          <p className="mt-2 text-muted-foreground">Find a clinic near you and see which doctors practise there.</p>
        </header>

        <DirectoryFilters
          key={toQuery(sp, ['q', 'city', 'lat', 'lng'])}
          values={{ q: first(sp.q), city: first(sp.city), near: hasLocation }}
          searchLabel="Clinic name"
          searchPlaceholder="Search clinics"
        />

        <section aria-label="Results" className="mt-8">
          {!result ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center text-sm text-destructive">
              We couldn&apos;t load clinics right now. Please try again in a moment.
            </div>
          ) : result.items.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
              <SearchX className="mb-3 size-8 text-muted-foreground" />
              <p className="font-medium">No clinics match your search</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try another name or city, or clear the filters.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="size-4" />
                {result.total} clinic{result.total === 1 ? '' : 's'}
                {hasLocation && ' sorted by distance'}
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((c) => (
                  <li key={c.id}>
                    <ClinicCard clinic={c} />
                  </li>
                ))}
              </ul>
              <PageLinks basePath="/clinics" searchParams={sp} page={result.page} totalPages={result.totalPages} total={result.total} />
            </>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
