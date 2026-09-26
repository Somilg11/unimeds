'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Menu, Search, Settings, type LucideIcon } from 'lucide-react';
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
import { ThemeToggle } from '@/components/app/theme-toggle';
import { CommandMenu, useCommandMenuHotkey } from '@/components/app/command-menu';
import { Logo } from '@/components/app/logo';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Show in the mobile bottom tab bar (max 4) */
  tab?: boolean;
};

type Props = {
  nav: NavItem[];
  settingsHref?: string;
  /** Line under the logo on desktop, e.g. the clinic name */
  context?: React.ReactNode;
  /** Enables doctor search in ⌘K; returns where a picked doctor should open */
  doctorSearch?: (doctorId: string) => string;
  /**
   * 'tabs' (patient, doctor): mobile-first, greeting header + floating bottom tab bar.
   * 'menu' (clinic, admin): desktop-first, sheet menu on small screens.
   */
  mobile?: 'tabs' | 'menu';
  children: React.ReactNode;
};

const isActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

function SideNav({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {nav.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
              active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
            )}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Floating dark pill tab bar (mobile). The active tab expands to show its label. */
function TabBar({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const tabs = nav.filter((n) => n.tab).slice(0, 4);
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center justify-between rounded-full bg-inverse p-1.5 text-inverse-foreground shadow-lg ring-1 ring-white/10 lg:hidden"
    >
      {tabs.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-inverse-foreground/70 transition-all',
              active ? 'bg-inverse-foreground text-inverse' : 'hover:text-inverse-foreground'
            )}
          >
            <item.icon className="size-5" />
            {active && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ nav, settingsHref, context, doctorSearch, mobile = 'menu', children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdk, setCmdk] = useState(false);
  useCommandMenuHotkey(setCmdk);
  const { data: session } = useSession();
  const user = session?.user;
  const firstName = user?.name?.replace(/^dr\.?\s+/i, '').split(/\s+/)[0];
  const tabs = mobile === 'tabs';

  const accountMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40" aria-label="Account menu">
          <Avatar className="size-10">
            {user?.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-accent font-semibold text-accent-foreground">{initials(user?.name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="truncate text-sm font-semibold text-foreground">{user?.name || 'Account'}</div>
          <div className="truncate text-xs font-normal">{user?.email}</div>
          {user?.role && <div className="pt-1 text-xs font-normal text-primary">{ROLE_LABEL[user.role]}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tabs &&
          nav
            .filter((n) => !n.tab && n.href !== settingsHref)
            .map((n) => (
              <DropdownMenuItem key={n.href} asChild className="lg:hidden">
                <Link href={n.href}>
                  <n.icon /> {n.label}
                </Link>
              </DropdownMenuItem>
            ))}
        {settingsHref && (
          <DropdownMenuItem asChild>
            <Link href={settingsHref}>
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onSelect={() => signOut({ redirectTo: '/login' })}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div className="space-y-1 px-2">
          <Logo />
          {context && <p className="truncate pl-9 text-xs text-muted-foreground">{context}</p>}
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideNav nav={nav} />
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </div>
      </aside>

      {!tabs && (
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-72 gap-6 p-5">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo />
            <SideNav nav={nav} onNavigate={() => setMenuOpen(false)} />
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Appearance</span>
              <ThemeToggle />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <CommandMenu open={cmdk} onOpenChange={setCmdk} nav={nav} doctorSearch={doctorSearch} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-background px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 lg:hidden">
          {tabs ? (
            <>
              {accountMenu}
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-xs text-muted-foreground">Welcome back</p>
                <p className="truncate font-semibold">{firstName ? `Hello, ${firstName}` : 'Hello'}</p>
              </div>
              <ThemeToggle />
              <NotificationBell />
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
                <Menu />
              </Button>
              <Logo className="flex-1" />
              <NotificationBell />
              {accountMenu}
            </>
          )}
        </header>

        {/* Desktop header */}
        <header className="sticky top-0 z-20 hidden h-20 items-center gap-3 bg-background px-10 lg:flex">
          <button
            type="button"
            onClick={() => setCmdk(true)}
            className="flex h-11 w-full max-w-md items-center gap-3 rounded-full border bg-card px-4 text-sm text-muted-foreground transition-colors hover:border-foreground/20"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">{doctorSearch ? 'Search doctors, pages…' : 'Search or jump to…'}</span>
            <kbd className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
          <div className="flex-1" />
          <NotificationBell />
          {accountMenu}
        </header>

        <main className={cn('mx-auto w-full max-w-7xl flex-1 px-4 pt-2 pb-10 lg:px-10', tabs && 'pb-28 lg:pb-10')}>{children}</main>
      </div>

      {tabs && <TabBar nav={nav} />}
    </div>
  );
}
