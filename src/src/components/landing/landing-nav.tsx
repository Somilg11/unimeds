'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_HOME } from '@/lib/roles';
import { Logo } from '@/components/app/logo';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/clinics', label: 'Clinics' },
  { href: '/for-clinics', label: 'For clinics' },
  { href: '/support', label: 'Help' },
];

/** White pill navbar. Floats inside the blue hero on the landing page. */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const dashboard = role ? ROLE_HOME[role] : null;

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`));

  const authActions = (mobile: boolean) => {
    if (status === 'loading') return <div className={cn('h-10', mobile ? 'w-full' : 'w-48')} aria-hidden />;
    if (dashboard) {
      return (
        <Button asChild size="lg" className={cn(mobile && 'h-11 w-full')}>
          <Link href={dashboard} onClick={() => setOpen(false)}>
            Open dashboard
          </Link>
        </Button>
      );
    }
    return (
      <div className={cn('flex items-center gap-1', mobile && 'flex-col-reverse items-stretch gap-2')}>
        <Button asChild variant="ghost" size="lg" className={cn(mobile && 'h-11 w-full')}>
          <Link href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        </Button>
        <Button asChild size="lg" className={cn(mobile && 'h-11 w-full')}>
          <Link href="/signup" onClick={() => setOpen(false)}>
            Get started
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <header className="grid h-14 grid-cols-[1fr_auto] items-center gap-3 rounded-full bg-card py-2 pr-2 pl-4 text-card-foreground sm:pl-5 lg:grid-cols-[1fr_auto_1fr]">
      {/* Three columns keep the links centred no matter how wide the right side renders */}
      <Logo className="shrink-0 justify-self-start" />

      <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              isActive(item.href) ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center justify-self-end gap-1 lg:flex">
        <ThemeToggle />
        {authActions(false)}
      </div>

      <div className="flex items-center justify-self-end gap-1 lg:hidden">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon-lg" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors',
                    isActive(item.href) ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-4">{authActions(true)}</div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
