import { SiteShell } from '@/components/landing/site-shell';

interface InfoPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function InfoPageLayout({ children, title, description }: InfoPageLayoutProps) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-muted-foreground">{description}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </SiteShell>
  );
}
