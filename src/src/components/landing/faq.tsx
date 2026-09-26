'use client';

import { useId, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FaqItem = { q: string; a: React.ReactNode };

/**
 * Single-open accordion. The open item becomes a solid blue card; the rest are
 * quiet grey cards with an arrow. Buttons carry aria-expanded / aria-controls.
 */
export function Faq({ items, defaultOpen = 0, tone = 'muted' }: { items: FaqItem[]; defaultOpen?: number | null; tone?: 'muted' | 'card' }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const base = useId();
  return (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${base}-q-${i}`;
        const panelId = `${base}-a-${i}`;
        return (
          <li
            key={item.q}
            className={cn(
              'rounded-3xl transition-colors',
              isOpen ? 'bg-brand text-brand-foreground' : tone === 'card' ? 'bg-card' : 'bg-muted'
            )}
          >
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-14 w-full items-center justify-between gap-4 rounded-3xl px-5 py-4 text-left text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/40 sm:text-base"
              >
                {item.q}
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-transform',
                    isOpen ? 'rotate-90 bg-white text-brand' : tone === 'card' ? 'bg-muted text-foreground' : 'bg-card text-foreground'
                  )}
                >
                  <ArrowUpRight className="size-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="px-5 pb-5 text-sm leading-relaxed text-brand-foreground/85 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4"
            >
              {item.a}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
