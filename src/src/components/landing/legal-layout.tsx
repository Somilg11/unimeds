import Link from 'next/link';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteShell } from '@/components/landing/site-shell';
import { Eyebrow } from '@/components/landing/section';

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated: string;
}

const LEGAL_PAGES = [
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/security', label: 'Security' },
  { href: '/legal/compliance', label: 'Compliance' },
];

export function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
        <header className="space-y-4">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <nav aria-label="Legal pages" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {LEGAL_PAGES.map((p) => {
            const active = p.label === title || title.toLowerCase().startsWith(p.label.toLowerCase());
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-secondary text-secondary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-6 flex items-start gap-3 rounded-3xl bg-muted px-4 py-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          Draft — to be reviewed by counsel. This page describes how the product works today and is not yet a final legal document.
        </p>

        <article className="mt-6 rounded-3xl bg-card p-6 text-sm leading-relaxed text-muted-foreground sm:p-10 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_li]:leading-relaxed [&_p]:mb-4 [&_strong]:text-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </SiteShell>
  );
}
