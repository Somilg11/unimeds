'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LandingNavItem = {
  label: string;
  href?: string;
};

export type LandingNavAction = {
  label: string;
  href: string;
  tone?: 'ghost' | 'solid';
};

interface LandingNavProps {
  centerItems?: LandingNavItem[];
  actions?: LandingNavAction[];
  logoHref?: string;
}

const defaultCenterItems: LandingNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Support', href: '/support' },
  { label: 'Contact', href: '/contact' },
];

const defaultActions: LandingNavAction[] = [
  { label: 'Login / Register', href: '/auth/signin', tone: 'solid' },
];

export function LandingNav({ 
  centerItems = defaultCenterItems, 
  actions = defaultActions, 
  logoHref = '/' 
}: LandingNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  const [profileLink, setProfileLink] = useState('/user/dashboard');

  useEffect(() => {
    setIsClientLoggedIn(!!session?.user);
    
    // Choose redirection link dynamically
    if (session?.user?.role === 'doctor') {
      setProfileLink('/doctor/dashboard');
    } else if (session?.user?.role === 'clinic' || session?.user?.role === 'clinic_admin') {
      setProfileLink('/clinic/dashboard');
    } else {
      setProfileLink('/user/dashboard');
    }
  }, [session, status]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      window.location.href = '/';
    }
  };

  const authActions: LandingNavAction[] = [
    { label: 'Profile', href: profileLink, tone: 'ghost' },
    { label: 'Logout', href: '#', tone: 'solid' },
  ];

  const displayActions = isClientLoggedIn ? authActions : actions;

  return (
    <header className="fixed top-3 left-0 right-0 z-50 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-full border border-[#d4e1f7] bg-white/90 px-4 py-2 shadow-md backdrop-blur-xl">
          
          {/* Logo */}
          <Link href={logoHref} className="flex shrink-0 items-center pl-2 hover:scale-102 transition-transform">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#d4e1f7] bg-white shadow-sm flex items-center justify-center bg-[#EBF0FE]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/unimeds_logo.png" alt="UniMeds Logo" className="h-7 w-7 object-contain" />
            </div>
            <span className="ml-2.5 text-sm font-black tracking-tight text-[#0B0A0A]">UniMeds</span>
          </Link>

          {/* Center Items */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full bg-[#EBF0FE]/60 border border-[#d4e1f7]/50 p-1 md:flex">
            {centerItems.map((item) => (
              <Link
                key={item.label}
                href={item.href || '#'}
                className="rounded-full px-5 py-2 text-xs font-bold text-[#0B0A0A] tracking-wide transition hover:bg-white hover:shadow-xs hover:text-[#246AFE]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 md:flex">
            {displayActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  'rounded-full px-5 py-2 text-xs font-bold transition hover:scale-102 duration-200 flex items-center gap-1.5',
                  action.tone === 'solid'
                    ? 'bg-[#246AFE] text-white hover:bg-blue-600 shadow-sm'
                    : 'bg-transparent text-[#0B0A0A] hover:bg-[#EBF0FE]/60 border border-transparent hover:border-[#d4e1f7]'
                )}
                onClick={(e) => {
                  setMobileOpen(false);
                  if (action.label === 'Logout') {
                    handleLogout(e);
                  }
                }}
              >
                {action.label === 'Profile' && <UserIcon className="w-3.5 h-3.5" />}
                {action.label === 'Logout' && <LogOut className="w-3.5 h-3.5" />}
                {action.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d4e1f7] text-[#0B0A0A] transition hover:bg-[#EBF0FE]/50 md:hidden shrink-0"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="mt-2 rounded-3xl border border-[#d4e1f7] bg-white p-4 shadow-lg md:hidden animate-fade-in">
            <nav className="flex flex-col gap-2">
              {centerItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href || '#'}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-[#0B0A0A] transition hover:bg-[#EBF0FE]/30 hover:text-[#246AFE]"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="h-px bg-[#d4e1f7] my-2" />
              
              {displayActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn(
                    'w-full text-center rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-2',
                    action.tone === 'solid'
                      ? 'bg-[#246AFE] text-white hover:bg-blue-600 shadow-sm'
                      : 'border border-[#d4e1f7] text-[#0B0A0A] hover:bg-neutral-50'
                  )}
                  onClick={(e) => {
                    setMobileOpen(false);
                    if (action.label === 'Logout') {
                      handleLogout(e);
                    }
                  }}
                >
                  {action.label === 'Profile' && <UserIcon className="w-4 h-4" />}
                  {action.label === 'Logout' && <LogOut className="w-4 h-4" />}
                  {action.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
