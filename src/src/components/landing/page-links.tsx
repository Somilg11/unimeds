import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { first, type SearchParams } from '@/components/landing/public-data';

/** Link-based pagination for server-rendered directories. */
export function PageLinks({
  basePath,
  searchParams,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  searchParams: SearchParams;
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      const val = first(v);
      if (val && k !== 'page') q.set(k, val);
    }
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground tabular-nums">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="lg">
            <Link href={href(page - 1)}>
              <ChevronLeft /> Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="lg" disabled>
            <ChevronLeft /> Previous
          </Button>
        )}
        {page < totalPages ? (
          <Button asChild variant="outline" size="lg">
            <Link href={href(page + 1)}>
              Next <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="lg" disabled>
            Next <ChevronRight />
          </Button>
        )}
      </div>
    </nav>
  );
}
