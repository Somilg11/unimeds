import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Small pill label above a section heading. */
export function Eyebrow({ children, inverted, className }: { children: React.ReactNode; inverted?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
        inverted ? 'bg-white/15 text-brand-foreground' : 'bg-card text-foreground',
        className
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', inverted ? 'bg-white' : 'bg-primary')} />
      {children}
    </span>
  );
}

/** Big bold heading left, muted paragraph right (stacks on mobile). */
export function SplitHeading({
  id,
  eyebrow,
  title,
  description,
  action,
}: {
  id: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-12">
      <div className="space-y-4">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={id} className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      {(description || action) && (
        <div className="space-y-4 lg:pb-1">
          {description && <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>}
          {action}
        </div>
      )}
    </div>
  );
}

/** Round icon badge used across public pages. */
export function IconCircle({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn('inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground', className)}>
      <Icon className="size-5" />
    </span>
  );
}

/** Server-safe empty / error block for directory results. */
export function PublicNotice({
  icon: Icon,
  title,
  description,
  tone = 'default',
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: 'default' | 'error';
  action?: React.ReactNode;
}) {
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className="flex flex-col items-center rounded-3xl bg-card px-6 py-14 text-center">
      <span
        className={cn(
          'mb-4 inline-flex size-12 items-center justify-center rounded-full',
          tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground'
        )}
      >
        <Icon className="size-5" />
      </span>
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Button classes for use on a solid blue block: white solid pill and white outline pill. */
export const ON_BRAND_SOLID = 'h-12 bg-white px-6 text-brand hover:bg-white/90 dark:bg-white dark:hover:bg-white/90';
export const ON_BRAND_OUTLINE =
  'h-12 border-white/40 bg-transparent px-6 text-brand-foreground hover:bg-white/10 hover:text-brand-foreground dark:border-white/40 dark:bg-transparent dark:hover:bg-white/10';
