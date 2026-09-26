import type { Metadata } from 'next';
import { CloudOff, SearchX } from 'lucide-react';
import { PageContainer, SiteShell } from '@/components/landing/site-shell';
import { DirectoryFilters } from '@/components/landing/directory-filters';
import { ClinicCard } from '@/components/landing/clinic-card';
import { PageLinks } from '@/components/landing/page-links';
import { PublicNotice } from '@/components/landing/section';
import { first, toQuery, tryPublic, type Paged, type PublicClinic, type SearchParams } from '@/components/landing/public-data';

export const metadata: Metadata = {
  title: 'Clinics',
  description: 'Browse clinics on Unimeds and book with their doctors online.',
  alternates: { canonical: '/clinics' },
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
      <PageContainer>
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">Clinics</h1>
          <p className="text-muted-foreground">Find a clinic near you and see which doctors practise there.</p>
        </header>

        <DirectoryFilters
          key={toQuery(sp, ['q', 'city', 'lat', 'lng'])}
          values={{ q: first(sp.q), city: first(sp.city), near: hasLocation }}
          searchLabel="Clinic name"
          searchPlaceholder="Search clinics"
        />

        <section aria-label="Results" className="mt-8">
          {!result ? (
            <PublicNotice
              tone="error"
              icon={CloudOff}
              title="We couldn’t load clinics right now"
              description="Please try again in a moment."
            />
          ) : result.items.length === 0 ? (
            <PublicNotice icon={SearchX} title="No clinics match your search" description="Try another name or city, or clear the filters." />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{result.total}</span> clinic{result.total === 1 ? '' : 's'}
                {hasLocation && ' · sorted by distance'}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      </PageContainer>
    </SiteShell>
  );
}
