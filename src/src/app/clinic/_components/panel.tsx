'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** White rounded-3xl surface on the grey canvas (no border, no shadow). */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={cn('rounded-3xl bg-card', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="min-w-0 space-y-0.5">
            {title && (
              <h2 id={id} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-5 sm:p-6', (title || actions) && 'pt-4 sm:pt-4', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small count chip next to headings. */
export function CountChip({ children }: { children: React.ReactNode }) {
  return <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 align-middle text-xs font-medium text-muted-foreground tabular-nums">{children}</span>;
}

/** Person avatar with initials fallback in the light-blue tint. */
export function PersonAvatar({ name, src, className }: { name?: string | null; src?: string | null; className?: string }) {
  return (
    <Avatar className={cn('size-10 shrink-0', className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className="bg-accent font-semibold text-accent-foreground">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

/** Icon in a circle; `tone="accent"` (light blue) or `"muted"` (neutral). */
export function IconCircle({ icon: Icon, tone = 'accent', className }: { icon: LucideIcon; tone?: 'accent' | 'muted'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
        tone === 'accent' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
        className
      )}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}

/** Pill-shaped time/date chip. */
export function TimePill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold tabular-nums', className)}>
      {children}
    </span>
  );
}

/** Filter pill Select trigger styling on white panels / grey canvas. */
export const PILL_TRIGGER = 'h-10 rounded-full border-0 bg-card px-4 shadow-none';

/** Pill Tabs on the grey canvas: white track, solid blue active pill. */
export const PILL_TABS_LIST = 'h-11 bg-card group-data-horizontal/tabs:h-11';
export const PILL_TAB =
  'px-4 data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground';
