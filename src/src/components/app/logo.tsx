import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ href = '/', className, inverted }: { href?: string; className?: string; inverted?: boolean }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2', className)} aria-label="Unimeds home">
      <span
        aria-hidden
        className={cn('inline-flex size-7 items-center justify-center rounded-full', inverted ? 'bg-white text-brand' : 'bg-brand text-brand-foreground')}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none">
          <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-base font-bold tracking-tight">Unimeds</span>
    </Link>
  );
}
