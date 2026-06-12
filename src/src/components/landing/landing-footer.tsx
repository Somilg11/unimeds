'use client';

import Link from 'next/link';
import {
  BookDashed as Linkedin,
  SquarePlay as Youtube,
  DiscIcon as Discord,
} from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-[#f5f5f3] border-t border-neutral-200">
      {/* Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200">
        {/* Products */}
        <div className="border-b md:border-b-0 md:border-r border-neutral-200 p-6 lg:p-8">
          <h3 className="text-[13px] text-neutral-500 mb-6">
            Products
          </h3>
          <div className="space-y-2.5">
            <Link href="/user" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Patient Portal
            </Link>
            <Link href="/doctor" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Doctor Dashboard
            </Link>
            <Link href="/clinic" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Clinic Management
            </Link>
            <Link href="/admin" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Admin Console
            </Link>
            <span className="block text-[14px] text-neutral-400 cursor-default">
              Pricing
            </span>
          </div>
        </div>

        {/* Solutions */}
        <div className="border-b md:border-b-0 lg:border-r border-neutral-200 p-6 lg:p-8">
          <h3 className="text-[13px] text-neutral-500 mb-6">
            Solutions
          </h3>
          <div className="space-y-2.5">
            <Link href="/clinic" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Hospital Management
            </Link>
            <Link href="/doctor" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Telemedicine
            </Link>
            <Link href="/user" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Appointment Scheduling
            </Link>
            <Link href="/user" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              EHR Records
            </Link>
            <Link href="/clinic" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Analytics
            </Link>
          </div>
        </div>

        {/* Company */}
        <div className="border-b md:border-b-0 md:border-r border-neutral-200 p-6 lg:p-8">
          <h3 className="text-[13px] text-neutral-500 mb-6">
            Company
          </h3>
          <div className="space-y-2.5">
            <Link href="/support" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Support
            </Link>
            <Link href="/contact" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Contact
            </Link>
            <span className="block text-[14px] text-neutral-400 cursor-default">
              About
            </span>
            <span className="block text-[14px] text-neutral-400 cursor-default">
              Careers
            </span>
            <span className="block text-[14px] text-neutral-400 cursor-default">
              Blog
            </span>
          </div>
        </div>

        {/* Legal */}
        <div className="p-6 lg:p-8">
          <h3 className="text-[13px] text-neutral-500 mb-6">
            Legal
          </h3>
          <div className="space-y-2.5">
            <Link href="/legal/terms" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Privacy Policy
            </Link>
            <Link href="/legal/security" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Security
            </Link>
            <Link href="/legal/compliance" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
              Compliance
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-neutral-200 px-6 lg:px-10 py-10 lg:py-14 gap-8 lg:gap-0">
        <div className="flex items-center gap-5">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-neutral-900 transition-colors">
            <Linkedin className="w-6 h-6" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-neutral-900 transition-colors">
            <Youtube className="w-6 h-6" />
          </a>
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-neutral-900 transition-colors">
            <Discord className="w-6 h-6" />
          </a>
        </div>

        <div className="lg:text-right">
          <p className="text-[14px] mb-3 text-neutral-700">
            Get UniMeds
          </p>
          <div className="flex gap-2.5">
            <div className="bg-neutral-200 text-neutral-500 px-4 py-2 rounded text-[13px] font-medium cursor-default">
              App Store &mdash; Coming Soon
            </div>
            <div className="bg-neutral-200 text-neutral-500 px-4 py-2 rounded text-[13px] font-medium cursor-default">
              Google Play &mdash; Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Large Branding Area */}
      <div className="relative overflow-hidden">
        <div className="relative px-6 lg:px-10 py-8 mt-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="text-sm text-neutral-500">
            UniMeds &copy; 2026
          </div>

          {/* Giant Logo */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-0 pointer-events-none select-none">
            <div className="text-[200px] lg:text-[320px] leading-none font-black text-[#09092b] opacity-90">
              U
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-neutral-600">
              Select language
            </span>
            <select className="border border-neutral-300 bg-transparent px-3 py-1.5 text-[13px] rounded focus:outline-none focus:border-neutral-500">
              <option>English</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
