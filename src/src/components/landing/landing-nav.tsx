'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ArrowLeft } from 'lucide-react';

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-glass border-b border-gray-100/50">
      {/* Desktop */}
      <div className="hidden md:flex h-14 items-center max-w-[1400px] mx-auto px-6">
        <Link
          href="/"
          className="h-14 flex items-center justify-center shrink-0 mr-8"
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-apple border border-white/20 hover-lift">
            <span className="text-white text-[13px] font-bold">U</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6 h-full">
          <Link
            href="/user"
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Patients
          </Link>
          <Link
            href="/doctor"
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Doctors
          </Link>
          <Link
            href="/clinic"
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clinics
          </Link>
          <Link
            href="/admin"
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-6 h-full">
          <Link
            href="/support"
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-[13px] font-medium rounded-full shadow-apple hover-lift transition-all"
          >
            Contact
          </Link>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex h-14 items-center justify-between px-4 bg-background/70 backdrop-blur-md">
        <Link href="/" className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-apple border border-white/20">
          <span className="text-white text-xs font-bold">U</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 flex items-center justify-center"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200">
          <div className="divide-y divide-neutral-200">
            <Link href="/user" className="flex items-center justify-between px-4 py-4 hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
              <span className="text-sm font-medium">Patients</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
            <Link href="/doctor" className="flex items-center justify-between px-4 py-4 hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
              <span className="text-sm font-medium">Doctors</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
            <Link href="/clinic" className="flex items-center justify-between px-4 py-4 hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
              <span className="text-sm font-medium">Clinics</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
            <Link href="/admin" className="flex items-center justify-between px-4 py-4 hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
              <span className="text-sm font-medium">Admin</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
          <div className="border-t border-neutral-200 p-4 space-y-2">
            <Link href="/support" className="flex items-center justify-center h-11 bg-neutral-100 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Support
            </Link>
            <Link href="/contact" className="flex items-center justify-center gap-2 h-11 bg-neutral-950 text-white text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
