'use client';

import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Round back button + screen title, like a native app bar. */
export function BackBar({
  title,
  href,
  onBack,
  label = 'Back',
  children,
}: {
  title: string;
  href?: string;
  onBack?: () => void;
  label?: string;
  children?: React.ReactNode;
}) {
  const cls =
    'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-card transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none';
  return (
    <div className="mb-5 flex items-center gap-3">
      {href ? (
        <Link href={href} className={cls} aria-label={label}>
          <ArrowLeft className="size-5" />
        </Link>
      ) : (
        <button type="button" onClick={onBack} className={cls} aria-label={label}>
          <ArrowLeft className="size-5" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight lg:text-2xl lg:font-bold">{title}</h1>
      {children}
    </div>
  );
}

/** Icon in a round tint. `tone="muted"` for neutral icons. */
export function IconCircle({ icon: Icon, tone = 'accent', className }: { icon: LucideIcon; tone?: 'accent' | 'muted'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
        tone === 'accent' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
        className
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

/** Small labelled value with an icon circle, used for date / time / place tiles. */
export function InfoTile({
  icon,
  label,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3 rounded-3xl bg-card p-4', className)}>
      <IconCircle icon={icon} />
      <div className="min-w-0 text-sm leading-tight">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-1 font-semibold">{children}</div>
      </div>
    </div>
  );
}

/** Person avatar with initials fallback in the accent tint. */
export function PersonAvatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  return (
    <Avatar className={cn('size-12', className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className="bg-accent font-semibold text-accent-foreground">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

/** Pill filter chip. Selected chips are solid black so blue stays reserved for the key block. */
export function Chip({
  active,
  icon: Icon,
  children,
  className,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-50',
        Icon ? 'py-1 pr-4 pl-1' : 'px-4',
        active ? 'bg-secondary text-secondary-foreground' : 'bg-card hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    >
      {Icon && (
        <span
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-full',
            active ? 'bg-secondary-foreground/15 text-secondary-foreground' : 'bg-accent text-accent-foreground'
          )}
        >
          <Icon className="size-4" />
        </span>
      )}
      {children}
    </button>
  );
}

/** White card section with a title row. */
export function Panel({
  title,
  icon,
  description,
  action,
  children,
  className,
  id,
}: {
  title?: string;
  icon?: LucideIcon;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={cn('rounded-3xl bg-card p-5', className)}>
      {title && (
        <div className="mb-4 flex items-center gap-3">
          {icon && <IconCircle icon={icon} />}
          <div className="min-w-0 flex-1">
            <h2 id={id} className="font-semibold tracking-tight">
              {title}
            </h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
