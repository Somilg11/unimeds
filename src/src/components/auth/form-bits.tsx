'use client';

import { useFormStatus } from 'react-dom';
import { CircleAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className={cn('h-12 w-full', className)} disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

export function Field({
  label,
  name,
  hint,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; name: string; hint?: string }) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-describedby={hintId} className={cn('h-12 rounded-full px-4', className)} {...props} />
      {hint && (
        <p id={hintId} className="px-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

/** Neutral informational message inside auth cards. */
export function FormNotice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-3xl bg-muted px-4 py-3 text-sm">{children}</p>;
}

/** Title block at the top of each auth card. */
export function AuthHeader({ eyebrow, title, description }: { eyebrow?: string; title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {eyebrow && <p className="text-xs font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export const PASSWORD_HINT = 'At least 10 characters, including a letter and a number.';
