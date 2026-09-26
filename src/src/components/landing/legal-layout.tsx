import { SiteShell } from '@/components/landing/site-shell';

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated: string;
}

export function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        <p className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Draft — to be reviewed by counsel. This page describes how the product works today and is not yet a final legal document.
        </p>
        <div className="mt-10 max-w-none text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:leading-relaxed [&_p]:mb-4 [&_strong]:text-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </SiteShell>
  );
}
