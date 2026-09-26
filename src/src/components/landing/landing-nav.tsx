'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_HOME } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const NAV_LINKS = [
  { href: '/doctors', label: 'Find a doctor' },
  { href: '/clinics', label: 'Clinics' },
  { href: '/for-clinics', label: 'For clinics' },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const dashboard = role ? ROLE_HOME[role] : null;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const authActions = (mobile: boolean) => {
    if (status === 'loading') return <div className={cn('h-9', mobile ? 'w-full' : 'w-32')} aria-hidden />;
    if (dashboard) {
      return (
        <Button asChild className={cn(mobile && 'w-full')}>
          <Link href={dashboard} onClick={() => setOpen(false)}>
            Open dashboard
          </Link>
        </Button>
      );
    }
    return (
      <div className={cn('flex gap-2', mobile && 'flex-col')}>
        <Button asChild variant="ghost" className={cn(mobile && 'w-full')}>
          <Link href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        </Button>
        <Button asChild className={cn(mobile && 'w-full')}>
          <Link href="/signup" onClick={() => setOpen(false)}>
            Get started
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Unimeds home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/unimeds_logo.png" alt="" className="size-8 rounded-lg object-contain" />
          <span className="text-base font-semibold tracking-tight">Unimeds</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href) ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden md:block">{authActions(false)}</div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
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
                    'rounded-md px-3 py-2.5 text-sm font-medium',
                    isActive(item.href) ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 border-t px-4 pt-4">{authActions(true)}</div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
