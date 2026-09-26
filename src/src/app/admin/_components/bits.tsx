'use client';

import { useState } from 'react';
import { Check, Copy, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { initials, ROLE_LABEL } from '@/lib/format';
import type { Role } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClinicStatus } from './types';

const PILL = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap';

const CLINIC_STATUS_STYLE: Record<ClinicStatus, string> = {
  active: 'bg-accent text-accent-foreground',
  invited: 'bg-muted text-foreground',
  suspended: 'bg-destructive/10 text-destructive',
};
export const CLINIC_STATUS_LABEL: Record<ClinicStatus, string> = { invited: 'Invited', active: 'Active', suspended: 'Suspended' };

export function ClinicStatusBadge({ status, className }: { status: ClinicStatus; className?: string }) {
  return (
    <span className={cn(PILL, CLINIC_STATUS_STYLE[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {CLINIC_STATUS_LABEL[status]}
    </span>
  );
}

export function ActiveBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return <span className={cn(PILL, active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>{active ? activeLabel : inactiveLabel}</span>;
}

const ROLE_STYLE: Record<Role, string> = {
  super_admin: 'bg-secondary text-secondary-foreground',
  clinic_admin: 'bg-accent text-accent-foreground',
  doctor: 'bg-accent text-accent-foreground',
  patient: 'bg-muted text-foreground',
};

export function RolePill({ role, className }: { role: Role; className?: string }) {
  return <span className={cn(PILL, ROLE_STYLE[role], className)}>{ROLE_LABEL[role]}</span>;
}

/** Avatar + bold name + muted line, used wherever a person or clinic appears in a row. */
export function Identity({
  name,
  sub,
  imageUrl,
  size = 'size-9',
  children,
}: {
  name: string;
  sub?: React.ReactNode;
  imageUrl?: string | null;
  size?: string;
  /** Replaces the plain name (e.g. a link) */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={size}>
        {imageUrl && <AvatarImage src={imageUrl} alt="" />}
        <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate font-semibold">{children ?? name}</div>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

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

/** White rounded panel with an optional header row. Tables go inside with `flush`. */
export function Panel({
  title,
  titleId,
  description,
  actions,
  flush,
  className,
  children,
}: {
  title?: React.ReactNode;
  titleId?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Drop body padding so a table runs edge to edge */
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={titleId} className={cn('rounded-3xl bg-card', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-1 sm:px-6">
          <div className="min-w-0 space-y-0.5">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? 'px-2 pb-2 sm:px-3' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  );
}

/** Tailwind classes for filter controls that sit on the grey canvas. */
export const FILTER_CONTROL = 'h-10 rounded-full bg-card';
/** Muted table header row. */
export const TABLE_HEAD_ROW = 'hover:bg-transparent [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground';

/** Read-only invite link with a copy button, plus whether the email went out. */
export function InviteLinkResult({ url, emailSent, email }: { url: string; emailSent: boolean; email?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.');
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input readOnly value={url} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy invite link">
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        {emailSent
          ? `An invitation email was sent${email ? ` to ${email}` : ''}. You can also share this link directly.`
          : `The invitation email could not be sent${email ? ` to ${email}` : ''}. Share this link with them directly.`}{' '}
        The link is single-use and expires in 7 days.
      </p>
    </div>
  );
}
