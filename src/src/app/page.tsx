import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, User, Stethoscope, Building2, Shield,
  Activity, FileHeart, Calendar, Lock, Globe,
} from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { SpecialityMenu } from '@/components/landing/speciality-menu';
import { WhyChooseMe } from '@/components/landing/why-choose-me';
import doctorHero from '../../assets/image.png';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased">
      <LandingNav />

      {/* ── HERO SECTION ── */}
      <section className="relative w-full h-screen min-h-[760px] overflow-hidden flex items-center">

        {/* ── Split Background ── */}
        <div className="absolute inset-0 z-0 flex">
          <div className="w-[55%] h-full bg-[#EBF0FE]"></div>
          <div className="w-[45%] h-full bg-[#246AFE]"></div>
        </div>

        {/* ── Doctor Image (Centered Overlay) ── */}
        <div className="absolute inset-0 z-10 flex justify-center items-end pointer-events-none translate-x-[5%] lg:translate-x-[5%]">
          <div className="relative w-full max-w-[1100px] h-[90%]">
            <Image
              src={doctorHero}
              alt="Healthcare professional"
              fill
              priority
              className="object-contain object-bottom"
            />
          </div>
        </div>

        {/* ── Main Content Container ── */}
        <div className="relative z-20 w-full max-w-[1500px] mx-auto h-full flex justify-between px-8 lg:px-12 pointer-events-none">

          {/* ── LEFT SIDE (White Background Area) ── */}
          <div className="w-[50%] flex flex-col justify-center h-full pt-16 pl-8 lg:pl-16 pointer-events-auto">
            <div className="mb-10">
              <h1 className="text-[clamp(4rem,6vw,5.5rem)] font-black text-[#0B0A0A] leading-[1] tracking-tight mb-4">
                Advanced<br />
                Healthcare
              </h1>
              <p className="text-[13px] text-gray-500 font-medium leading-[1.6] max-w-[220px] tracking-wide normal-case">
                Providing <span className="font-bold text-[#0B0A0A]">world-class</span> medical expertise with a personal touch for your everyday well-being.
              </p>
            </div>

            <Link
              href="/user"
              className="inline-flex items-center justify-between bg-[#0B0A0A] text-white rounded-full w-[170px] p-1.5 pl-6 transition-colors duration-200 mb-16"
            >
              <span className="text-[13px] font-semibold">Find Doctor</span>
              <div className="bg-white rounded-full w-9 h-9 flex items-center justify-center shrink-0">
                <User className="w-[18px] h-[18px] text-[#0B0A0A]" />
              </div>
            </Link>

            <div className="bg-white rounded-[1.5rem] p-5 pr-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] flex items-stretch border border-gray-100 w-fit">
              <div className="py-1">
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Results we are proud of</p>
                  <div className="w-6 h-1.5 bg-[#0B0A0A] rounded-full opacity-80"></div>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-[28px] font-black text-[#0B0A0A] leading-none mb-1">10+</p>
                    <p className="text-[9px] font-semibold text-gray-500 uppercase leading-snug">years of<br />experience</p>
                  </div>
                  <div>
                    <p className="text-[28px] font-black text-[#0B0A0A] leading-none mb-1">20+</p>
                    <p className="text-[9px] font-semibold text-gray-500 uppercase leading-snug">highly qualified<br />doctors</p>
                  </div>
                  <div>
                    <p className="text-[28px] font-black text-[#0B0A0A] leading-none mb-1">100%</p>
                    <p className="text-[9px] font-semibold text-gray-500 uppercase leading-snug">digital<br />diagnostics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE ── */}
          <div className="w-[35%] flex flex-col justify-between h-full py-16 pl-12 lg:pl-24 pointer-events-auto text-white">
            <div className="pt-24">
              <h2 className="text-[2.5rem] font-light leading-[1.1] mb-5 tracking-tight">
                With Advanced<br />
                <span className="font-semibold">Technologies</span>
              </h2>
              <p className="text-[13px] text-blue-100 max-w-[320px] leading-relaxed">
                The latest <span className="font-semibold text-white">generation equipment</span>, digital diagnostics, advanced techniques — all of this works for your health.
              </p>
            </div>

            <div className="flex items-end justify-between pb-6 pl-4">
              <p className="text-[11px] text-blue-100 max-w-[180px] leading-relaxed">
                We appreciate every feedback, because it inspires us to become better.
              </p>
              <div className="flex items-center gap-4">
                <button className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="flex -space-x-2">
                  {['A', 'R', 'K'].map((ch, i) => (
                    <div
                      key={ch}
                      className="w-8 h-8 rounded-full bg-white text-[#246AFE] border border-white flex items-center justify-center text-[10px] font-bold shadow-sm"
                      style={{ zIndex: 3 - i }}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FLOATING PILLS ── */}

        {/* Reliability (Left side) */}
        <div className="absolute top-[56%] left-[32%] lg:left-[30%] z-30 flex items-center gap-2 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full text-[13px] font-semibold text-gray-800 shadow-sm border border-white/40">
            Reliability
          </div>
          <div className="w-10 h-px bg-white/40"></div>
          <div className="w-2 h-2 rounded-full border-[2px] border-white/60 bg-transparent"></div>
        </div>

        {/* Experience (Right side) */}
        <div className="absolute top-[48%] right-[35%] lg:right-[23%] z-30 flex items-center gap-2 flex-row-reverse pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full text-[13px] font-semibold text-gray-800 shadow-sm border border-white/40">
            Experience
          </div>
          <div className="w-10 h-px bg-white/40"></div>
          <div className="w-2 h-2 rounded-full border-[2px] border-white/60 bg-transparent"></div>
        </div>

        {/* Professional (Bottom Right side) */}
        <div className="absolute top-[75%] right-[20%] lg:right-[17%] z-30 flex items-center gap-2 flex-row-reverse pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full text-[13px] font-semibold text-gray-800 shadow-sm border border-white/40">
            Professional
          </div>
          <div className="w-10 h-px bg-white/40"></div>
          <div className="w-2 h-2 rounded-full border-[2px] border-white/60 bg-transparent"></div>
        </div>

      </section>

      {/* ── PORTAL CARDS ── */}


      <SpecialityMenu />

      <WhyChooseMe />

      {/* ── FEATURES ── */}


      {/* ── CTA / BOOKING SECTION ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-16 relative z-10">
        <div className="relative overflow-hidden rounded-[2rem] text-white px-8 py-20 lg:py-24 text-center flex flex-col items-center justify-center bg-[url('/stethoscope_cta_bg.png')] bg-cover bg-center border border-[#d4e1f7]/20">
          
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
            {/* Join Us Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Join us
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
              Your Health, Our Priority
            </h2>

            {/* Subtext */}
            <p className="text-xs sm:text-sm text-white/90 max-w-md leading-relaxed mb-8">
              Experience world-class healthcare with experienced doctors, modern facilities, and patient-centered treatment designed for your well-being.
            </p>

            {/* Pill button */}
            <Link
              href="/user"
              className="inline-flex items-center gap-3 bg-white text-[#246AFE] hover:bg-neutral-100 px-6 py-2.5 rounded-full text-[13px] font-bold transition-colors duration-200 shadow-sm"
            >
              <span>Book an appointment</span>
              <div className="w-6 h-6 rounded-full bg-[#246AFE] text-white flex items-center justify-center shrink-0">
                <ArrowRight className="w-3 h-3 rotate-[-45deg]" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
