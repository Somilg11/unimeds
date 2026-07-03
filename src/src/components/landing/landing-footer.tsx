'use client';

import Link from 'next/link';
import {
  BookDashed as Linkedin,
  SquarePlay as Youtube,
  DiscIcon as Discord,
} from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-gray-100">
          {/* Products */}
          <div className="border-b md:border-b-0 md:border-r border-gray-100 p-8 lg:p-10">
            <h3 className="text-[12px] font-bold tracking-widest text-[#246AFE] uppercase mb-6">
              Products
            </h3>
            <div className="space-y-3">
              <Link href="/user" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Patient Portal
              </Link>
              <Link href="/doctor" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Doctor Dashboard
              </Link>
              <Link href="/clinic" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Clinic Management
              </Link>
              <Link href="/admin" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Admin Console
              </Link>
              <span className="block text-[14px] font-medium text-gray-400 cursor-default">
                Pricing
              </span>
            </div>
          </div>

          {/* Solutions */}
          <div className="border-b md:border-b-0 lg:border-r border-gray-100 p-8 lg:p-10">
            <h3 className="text-[12px] font-bold tracking-widest text-[#246AFE] uppercase mb-6">
              Solutions
            </h3>
            <div className="space-y-3">
              <Link href="/clinic" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Hospital Management
              </Link>
              <Link href="/doctor" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Telemedicine
              </Link>
              <Link href="/user" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Appointment Scheduling
              </Link>
              <Link href="/user" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                EHR Records
              </Link>
              <Link href="/clinic" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Analytics
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="border-b md:border-b-0 md:border-r border-gray-100 p-8 lg:p-10">
            <h3 className="text-[12px] font-bold tracking-widest text-[#246AFE] uppercase mb-6">
              Company
            </h3>
            <div className="space-y-3">
              <Link href="/support" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Support
              </Link>
              <Link href="/contact" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Contact
              </Link>
              <span className="block text-[14px] font-medium text-gray-400 cursor-default">
                About
              </span>
              <span className="block text-[14px] font-medium text-gray-400 cursor-default">
                Careers
              </span>
              <span className="block text-[14px] font-medium text-gray-400 cursor-default">
                Blog
              </span>
            </div>
          </div>

          {/* Legal */}
          <div className="p-8 lg:p-10">
            <h3 className="text-[12px] font-bold tracking-widest text-[#246AFE] uppercase mb-6">
              Legal
            </h3>
            <div className="space-y-3">
              <Link href="/legal/terms" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/security" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Security
              </Link>
              <Link href="/legal/compliance" className="block text-[14px] font-medium text-gray-600 hover:text-[#246AFE] transition-colors">
                Compliance
              </Link>
            </div>
          </div>
        </div>

        {/* Middle Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-100 px-8 lg:px-10 py-10 gap-8 lg:gap-0">
          <div className="flex items-center gap-6">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#246AFE] transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#246AFE] transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#246AFE] transition-colors">
              <Discord className="w-5 h-5" />
            </a>
          </div>

          <div className="lg:text-right">
            <p className="text-[12px] font-bold tracking-widest text-[#0B0A0A] uppercase mb-3">
              Get UniMeds
            </p>
            <div className="flex gap-3">
              <div className="bg-[#F5F5F7] border border-gray-200 text-gray-600 px-5 py-2.5 rounded-full text-[12px] font-semibold cursor-default">
                App Store &mdash; Coming Soon
              </div>
              <div className="bg-[#F5F5F7] border border-gray-200 text-gray-600 px-5 py-2.5 rounded-full text-[12px] font-semibold cursor-default">
                Google Play &mdash; Coming Soon
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Branding Area */}
        <div className="relative px-8 lg:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-sm font-medium text-gray-500">
            UniMeds &copy; 2026
          </div>

          {/* Language */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Language
            </span>
            <select className="bg-[#F5F5F7] border border-gray-200 text-[#0B0A0A] px-4 py-2 text-[13px] font-medium rounded-full focus:outline-none focus:border-[#246AFE] transition-colors cursor-pointer appearance-none">
              <option>English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Giant Logo Watermark */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-0 pointer-events-none select-none z-0">
        <div className="text-[200px] lg:text-[400px] leading-none font-black text-[#0B0A0A] opacity-[0.03]">
          U
        </div>
      </div>
    </footer>
  );
}
