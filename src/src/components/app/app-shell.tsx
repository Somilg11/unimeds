'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Menu, Settings, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initials, ROLE_LABEL } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/app/notification-bell';

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

type Props = {
  nav: NavItem[];
  settingsHref?: string;
  context?: React.ReactNode; // e.g. clinic name under the logo
  children: React.ReactNode;
};

function NavLinks({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              active && 'bg-primary/10 text-primary'
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ nav, settingsHref, context, children }: Props) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  const brand = (
    <div className="space-y-1 px-3">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Unimeds
      </Link>
      {context && <div className="truncate text-xs text-muted-foreground">{context}</div>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r bg-card px-3 py-6 lg:flex">
        {brand}
        <NavLinks nav={nav} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-8 px-3 py-6">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {brand}
          <NavLinks nav={nav} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <div className="flex-1" />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
                <Avatar className="size-8">
                  {user?.image && <AvatarImage src={user.image} alt="" />}
                  <AvatarFallback>{initials(user?.name)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="space-y-0.5">
                <div className="truncate text-sm font-medium">{user?.name || 'Account'}</div>
                <div className="truncate text-xs font-normal text-muted-foreground">{user?.email}</div>
                {user?.role && <div className="text-xs font-normal text-muted-foreground">{ROLE_LABEL[user.role]}</div>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {settingsHref && (
                <DropdownMenuItem asChild>
                  <Link href={settingsHref}>
                    <Settings /> Settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => signOut({ redirectTo: '/login' })}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
