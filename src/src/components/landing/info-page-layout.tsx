import { SiteShell } from '@/components/landing/site-shell';
import { Eyebrow } from '@/components/landing/section';

interface InfoPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
}

export function InfoPageLayout({ children, title, description, eyebrow }: InfoPageLayoutProps) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
        <header className="space-y-4">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </header>
        <div className="mt-10">{children}</div>
      </div>
    </SiteShell>
  );
}
