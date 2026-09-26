'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Monitor, Moon, Search, Stethoscope, Sun } from 'lucide-react';
import { api } from '@/lib/api';
import type { Paged, PublicDoctor } from '@/lib/types';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import type { NavItem } from '@/components/app/app-shell';

export function useCommandMenuHotkey(setOpen: (fn: (v: boolean) => boolean) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);
}

/** ⌘K palette: jump anywhere in the portal, switch theme, find a doctor. */
export function CommandMenu({
  open,
  onOpenChange,
  nav,
  doctorSearch,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nav: NavItem[];
  /** Where a picked doctor should go (patient portal books, others view the public profile) */
  doctorSearch?: (id: string) => string;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [q, setQ] = useState('');

  const { data: doctors } = useQuery({
    queryKey: ['cmdk', 'doctors', q],
    queryFn: () => api.get<Paged<PublicDoctor>>('/public/doctors', { q, pageSize: 5 }),
    enabled: Boolean(doctorSearch) && q.trim().length >= 2,
    staleTime: 60_000,
  });

  const go = (href: string) => {
    onOpenChange(false);
    setQ('');
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command menu" description="Navigate or run an action">
      <Command shouldFilter={!doctors?.items.length}>
        <CommandInput placeholder="Type a command or search…" value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {doctorSearch && doctors && doctors.items.length > 0 && (
            <>
              <CommandGroup heading="Doctors">
                {doctors.items.map((d) => (
                  <CommandItem key={d.id} value={`doctor ${d.name} ${d.specialization ?? ''}`} onSelect={() => go(doctorSearch(d.id))}>
                    <Stethoscope />
                    <span>{d.name}</span>
                    {d.specialization && <span className="text-muted-foreground">· {d.specialization}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          <CommandGroup heading="Go to">
            {nav.map((item) => (
              <CommandItem key={item.href} value={`go ${item.label}`} onSelect={() => go(item.href)}>
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
            {doctorSearch && (
              <CommandItem value="find a doctor search" onSelect={() => go('/doctors')}>
                <Search />
                Browse all doctors
              </CommandItem>
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Preferences">
            <CommandItem value="theme dark" onSelect={() => setTheme('dark')}>
              <Moon /> Dark theme
            </CommandItem>
            <CommandItem value="theme light" onSelect={() => setTheme('light')}>
              <Sun /> Light theme
            </CommandItem>
            <CommandItem value="theme system" onSelect={() => setTheme('system')}>
              <Monitor /> System theme
            </CommandItem>
            <CommandItem value="sign out logout" onSelect={() => signOut({ redirectTo: '/login' })}>
              <LogOut /> Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
