'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClinicStatus } from './types';

const CLINIC_STATUS_STYLE: Record<ClinicStatus, string> = {
  invited: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
  active: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300',
  suspended: 'bg-rose-100 text-rose-900 dark:bg-rose-500/15 dark:text-rose-300',
};
export const CLINIC_STATUS_LABEL: Record<ClinicStatus, string> = { invited: 'Invited', active: 'Active', suspended: 'Suspended' };

export function ClinicStatusBadge({ status, className }: { status: ClinicStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', CLINIC_STATUS_STYLE[status], className)}>
      {CLINIC_STATUS_LABEL[status]}
    </span>
  );
}

export function ActiveBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        active ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

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
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input readOnly value={url} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy invite link">
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {emailSent
          ? `An invitation email was sent${email ? ` to ${email}` : ''}. You can also share this link directly.`
          : `The invitation email could not be sent${email ? ` to ${email}` : ''}. Share this link with them directly.`}{' '}
        The link is single-use and expires in 7 days.
      </p>
    </div>
  );
}
