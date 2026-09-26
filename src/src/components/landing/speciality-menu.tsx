import Link from 'next/link';
import { ArrowRight, Stethoscope } from 'lucide-react';
import type { Specialization } from '@/components/landing/public-data';

/** Specializations that currently have bookable doctors, from GET /public/specializations. */
export function SpecialityMenu({ items }: { items: Specialization[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="specialities-h" className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 id="specialities-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Browse by specialization
            </h2>
            <p className="mt-2 text-muted-foreground">Specializations with doctors taking bookings on Unimeds.</p>
          </div>
          <Link href="/doctors" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            All doctors <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 12).map((s) => (
            <li key={s.name}>
              <Link
                href={`/doctors?specialization=${encodeURIComponent(s.name)}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Stethoscope className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.doctors} doctor{s.doctors === 1 ? '' : 's'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
