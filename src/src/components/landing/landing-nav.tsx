'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ArrowLeft } from 'lucide-react';

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
      {/* Desktop */}
      <div className="hidden md:flex h-13 items-center">
        <Link
          href="/"
          className="h-13 w-14 border-r border-neutral-200 flex items-center justify-center shrink-0"
        >
          <div className="w-7 h-7 bg-neutral-900 flex items-center justify-center m-1 border-2 border-neutral-900">
            <span className="text-white text-xs font-bold">U</span>
          </div>
        </Link>

        <nav className="flex h-full">
          <Link
            href="/user"
            className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
          >
            Patients
          </Link>
          <Link
            href="/doctor"
            className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
          >
            Doctors
          </Link>
          <Link
            href="/clinic"
            className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
          >
            Clinics
          </Link>
          <Link
            href="/admin"
            className="h-full px-5 flex items-center border-r border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
          >
            Admin
          </Link>
        </nav>

        <div className="flex-1" />

        <div className="flex h-full">
          <Link
            href="/support"
            className="h-full px-6 flex items-center border-l border-neutral-200 text-[15px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
          >
            Support
          </Link>
          <Link
            href="/contact"
            className="h-full px-6 flex items-center bg-neutral-950 text-white text-[15px] font-medium hover:bg-black transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex h-13 items-center justify-between px-4">
        <Link href="/" className="w-8 h-8 bg-neutral-900 flex items-center justify-center">
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
