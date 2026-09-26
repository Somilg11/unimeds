import Link from 'next/link';
import { ArrowRight, Stethoscope } from 'lucide-react';
import type { Specialization } from '@/components/landing/public-data';
import { SplitHeading } from '@/components/landing/section';
import { Button } from '@/components/ui/button';

/** Specializations that currently have bookable doctors, from GET /public/specializations. */
export function SpecialityMenu({ items }: { items: Specialization[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="specialities-h" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <SplitHeading
        id="specialities-h"
        eyebrow="Specialties"
        title="Find care by specialty"
        description="Specialties with doctors taking bookings on Unimeds right now. Pick one to see who’s available."
        action={
          <Button asChild variant="secondary" size="lg">
            <Link href="/doctors">
              All doctors <ArrowRight />
            </Link>
          </Button>
        }
      />
      <ul className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {items.slice(0, 16).map((s) => (
          <li key={s.name} className="shrink-0">
            <Link
              href={`/doctors?specialization=${encodeURIComponent(s.name)}`}
              className="flex items-center gap-2 rounded-full bg-card py-1.5 pr-4 pl-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Stethoscope className="size-4" />
              </span>
              {s.name}
              <span className="text-xs text-muted-foreground tabular-nums">{s.doctors}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
