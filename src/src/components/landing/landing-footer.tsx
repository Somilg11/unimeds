// 'use client';

// import Link from 'next/link';
// import {
//   BookDashed as Linkedin,
//   SquarePlay as Youtube,
//   DiscIcon as Discord,
// } from 'lucide-react';

// export function LandingFooter() {
//   return (
//     <footer className="bg-gray-50/50 border-t border-gray-100">
//       {/* Top Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-gray-100">
//         {/* Products */}
//         <div className="border-b md:border-b-0 border-gray-100 p-6 lg:p-8">
//           <h3 className="text-[13px] text-muted-foreground mb-6">
//             Products
//           </h3>
//           <div className="space-y-2.5">
//             <Link href="/user" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
//               Patient Portal
//             </Link>
//             <Link href="/doctor" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
//               Doctor Dashboard
//             </Link>
//             <Link href="/clinic" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               Clinic Management
//             </Link>
//             <Link href="/admin" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               Admin Console
//             </Link>
//             <span className="block text-[14px] text-neutral-400 cursor-default">
//               Pricing
//             </span>
//           </div>
//         </div>

//         {/* Solutions */}
//         <div className="border-b md:border-b-0 border-gray-100 p-6 lg:p-8">
//           <h3 className="text-[13px] text-neutral-500 mb-6">
//             Solutions
//           </h3>
//           <div className="space-y-2.5">
//             <Link href="/clinic" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               Hospital Management
//             </Link>
//             <Link href="/doctor" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               Telemedicine
//             </Link>
//             <Link href="/user" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               Appointment Scheduling
//             </Link>
//             <Link href="/user" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               EHR Records
//             </Link>
//             <Link href="/clinic" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               Analytics
//             </Link>
//           </div>
//         </div>

//         {/* Company */}
//         <div className="border-b md:border-b-0 border-gray-100 p-6 lg:p-8">
//           <h3 className="text-[13px] text-neutral-500 mb-6">
//             Company
//           </h3>
//           <div className="space-y-2.5">
//             <Link href="/support" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               Support
//             </Link>
//             <Link href="/contact" className="block text-[14px] text-neutral-900 hover:opacity-70 transition-opacity">
//               Contact
//             </Link>
//             <span className="block text-[14px] text-neutral-400 cursor-default">
//               About
//             </span>
//             <span className="block text-[14px] text-neutral-400 cursor-default">
//               Careers
//             </span>
//             <span className="block text-[14px] text-neutral-400 cursor-default">
//               Blog
//             </span>
//           </div>
//         </div>

//         {/* Legal */}
//         <div className="p-6 lg:p-8">
//           <h3 className="text-[13px] text-neutral-500 mb-6">
//             Legal
//           </h3>
//           <div className="space-y-2.5">
//             <Link href="/legal/terms" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
//               Terms of Service
//             </Link>
//             <Link href="/legal/privacy" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
//               Privacy Policy
//             </Link>
//             <Link href="/legal/security" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
//               Security
//             </Link>
//             <Link href="/legal/compliance" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
//               Compliance
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* Middle Row */}
//       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-100 px-6 lg:px-10 py-10 lg:py-14 gap-8 lg:gap-0">
//         <div className="flex items-center gap-5">
//           <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-neutral-900 transition-colors">
//             <Linkedin className="w-6 h-6" />
//           </a>
//           <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-neutral-900 transition-colors">
//             <Youtube className="w-6 h-6" />
//           </a>
//           <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-neutral-900 transition-colors">
//             <Discord className="w-6 h-6" />
//           </a>
//         </div>

//         <div className="lg:text-right">
//           <p className="text-[14px] mb-3 text-neutral-700 font-medium">
//             Get UniMeds
//           </p>
//           <div className="flex gap-2.5">
//             <div className="bg-white border border-gray-100 shadow-apple text-neutral-500 px-4 py-2 rounded-full text-[13px] font-medium cursor-default">
//               App Store &mdash; Coming Soon
//             </div>
//             <div className="bg-white border border-gray-100 shadow-apple text-neutral-500 px-4 py-2 rounded-full text-[13px] font-medium cursor-default">
//               Google Play &mdash; Coming Soon
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Large Branding Area */}
//       <div className="relative overflow-hidden">
//         <div className="relative px-6 lg:px-10 py-8 mt-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
//           <div className="text-sm text-neutral-500">
//             UniMeds &copy; 2026
//           </div>

//           {/* Giant Logo */}
//           <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-0 pointer-events-none select-none">
//             <div className="text-[200px] lg:text-[320px] leading-none font-black text-[#09092b] opacity-90">
//               U
//             </div>
//           </div>

//           {/* Language */}
//           <div className="flex items-center gap-3">
//             <span className="text-[13px] text-neutral-600">
//               Select language
//             </span>
//             <select className="border border-gray-200 bg-white shadow-apple px-3 py-1.5 text-[13px] rounded-full focus:outline-none focus:border-gray-400">
//               <option>English</option>
//             </select>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }
'use client';

import Link from 'next/link';
import {
  BookDashed as Linkedin,
  SquarePlay as Youtube,
  DiscIcon as Discord,
} from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-gray-50/50 border-t border-gray-100 overflow-hidden">
      {/* Top Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-gray-100">

        {/* Products */}
        <div className="border-b sm:border-r lg:border-b-0 border-gray-100 p-6 sm:p-8 lg:p-10">
          <h3 className="text-[13px] font-semibold text-muted-foreground mb-5 sm:mb-6 uppercase tracking-wider">
            Products
          </h3>
          <div className="space-y-3 sm:space-y-2.5">
            <Link href="/user" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Patient Portal
            </Link>
            <Link href="/doctor" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Doctor Dashboard
            </Link>
            <Link href="/clinic" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Clinic Management
            </Link>
            <Link href="/admin" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Admin Console
            </Link>
            <span className="block text-[14px] text-neutral-400 cursor-default">
              Pricing
            </span>
          </div>
        </div>

        {/* Solutions */}
        <div className="border-b lg:border-r lg:border-b-0 border-gray-100 p-6 sm:p-8 lg:p-10">
          <h3 className="text-[13px] font-semibold text-neutral-500 mb-5 sm:mb-6 uppercase tracking-wider">
            Solutions
          </h3>
          <div className="space-y-3 sm:space-y-2.5">
            <Link href="/clinic" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Hospital Management
            </Link>
            <Link href="/doctor" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Telemedicine
            </Link>
            <Link href="/user" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Appointment Scheduling
            </Link>
            <Link href="/user" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              EHR Records
            </Link>
            <Link href="/clinic" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Analytics
            </Link>
          </div>
        </div>

        {/* Company */}
        <div className="border-b sm:border-b-0 sm:border-r border-gray-100 p-6 sm:p-8 lg:p-10">
          <h3 className="text-[13px] font-semibold text-neutral-500 mb-5 sm:mb-6 uppercase tracking-wider">
            Company
          </h3>
          <div className="space-y-3 sm:space-y-2.5">
            <Link href="/support" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Support
            </Link>
            <Link href="/contact" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
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
        <div className="p-6 sm:p-8 lg:p-10">
          <h3 className="text-[13px] font-semibold text-neutral-500 mb-5 sm:mb-6 uppercase tracking-wider">
            Legal
          </h3>
          <div className="space-y-3 sm:space-y-2.5">
            <Link href="/legal/terms" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Privacy Policy
            </Link>
            <Link href="/legal/security" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Security
            </Link>
            <Link href="/legal/compliance" className="block text-[14px] text-foreground hover:opacity-70 transition-opacity">
              Compliance
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-100 px-6 sm:px-8 lg:px-10 py-10 lg:py-14 gap-8 lg:gap-0">
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

        <div className="lg:text-right w-full lg:w-auto">
          <p className="text-[14px] mb-3 text-neutral-700 font-medium">
            Get UniMeds
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="bg-white border border-gray-100 shadow-sm text-neutral-500 px-4 py-2.5 sm:py-2 rounded-full text-[13px] font-medium cursor-default text-center">
              App Store &mdash; Coming Soon
            </div>
            <div className="bg-white border border-gray-100 shadow-sm text-neutral-500 px-4 py-2.5 sm:py-2 rounded-full text-[13px] font-medium cursor-default text-center">
              Google Play &mdash; Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Large Branding Area */}
      <div className="relative overflow-hidden bg-background">
        <div className="relative px-6 sm:px-8 lg:px-10 py-8 lg:py-10 mt-10 lg:mt-20 flex flex-col-reverse md:flex-row items-center md:items-end justify-between gap-6 z-10">
          <div className="text-[13px] sm:text-sm text-neutral-500 text-center md:text-left w-full md:w-auto">
            UniMeds &copy; 2026
          </div>

          {/* Giant Logo (Hidden on smaller screens, shown on desktop) */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-[-10%] pointer-events-none select-none z-0">
            <div className="text-[200px] lg:text-[320px] leading-none font-black text-[#09092b] opacity-90 tracking-tighter">
              U
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
            <span className="text-[13px] text-neutral-600">
              Select language
            </span>
            <select className="border border-gray-200 bg-white shadow-sm px-3 py-1.5 text-[13px] rounded-full focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer">
              <option>English</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}