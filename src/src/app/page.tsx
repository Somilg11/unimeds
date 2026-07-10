
import Link from 'next/link';
import { ArrowRight, User, Stethoscope, Building2, Shield, Activity, FileHeart, Calendar, Lock, Globe } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { SpecialityMenu } from '@/components/landing/speciality-menu';
import { WhyChooseMe } from '@/components/landing/why-choose-me';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <LandingNav />

      {/* ── HERO SECTION ── */}
      <section className="relative w-full min-h-[100dvh] flex flex-col lg:flex-row lg:items-center bg-background pt-28 lg:pt-0">

        {/* ── Split Background (Desktop Only) ── */}
        <div className="hidden lg:flex absolute inset-0 z-0">
          <div className="w-[55%] h-full bg-background"></div>
          <div className="w-[45%] h-full bg-secondary"></div>
        </div>

        {/* ── Main Content Container ── */}
        <div className="relative z-20 w-full max-w-[1500px] mx-auto h-full flex flex-col lg:flex-row justify-between pointer-events-none">

          {/* ── LEFT SIDE (White Background Area) ── */}
          <div className="w-full lg:w-[50%] flex flex-col justify-center px-6 sm:px-10 lg:pl-16 lg:pr-8 pt-4 lg:pt-16 pb-8 lg:pb-0 pointer-events-auto order-1 lg:order-none z-20">
            <div className="mb-8 lg:mb-10 text-center lg:text-left">
              <h1 className="text-[clamp(3.5rem,10vw,5.5rem)] font-black text-foreground leading-[1.05] tracking-tight mb-4">
                Advanced<br />
                Healthcare
              </h1>
              <p className="text-[14px] lg:text-[13px] text-muted-foreground font-medium leading-[1.6] max-w-[300px] lg:max-w-[220px] tracking-wide normal-case mx-auto lg:mx-0">
                Providing <span className="font-bold text-foreground">world-class</span> medical expertise with a personal touch for your everyday well-being.
              </p>
            </div>

            <div className="flex flex-col items-center lg:items-start w-full">
              <Link
                href="/user"
                className="inline-flex items-center justify-between bg-primary hover:bg-primary/90 text-white rounded-full w-[170px] p-1.5 pl-6 transition-colors duration-200 mb-10 lg:mb-16 shadow-apple hover-lift"
              >
                <span className="text-[13px] font-semibold">Find Doctor</span>
                <div className="bg-white rounded-full w-9 h-9 flex items-center justify-center shrink-0">
                  <User className="w-[18px] h-[18px] text-primary" />
                </div>
              </Link>

              <div className="bg-card/90 backdrop-blur-xl rounded-[1.5rem] p-5 lg:pr-10 shadow-apple flex items-stretch border border-border/50 w-full sm:w-fit hover-lift mx-auto lg:mx-0">
                <div className="py-1 w-full text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Results we are proud of</p>
                    <div className="w-6 h-1.5 bg-primary rounded-full opacity-80"></div>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap justify-center gap-6 sm:gap-8">
                    <div>
                      <p className="text-[28px] font-black text-foreground leading-none mb-1">10+</p>
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase leading-snug">years of<br />experience</p>
                    </div>
                    <div>
                      <p className="text-[28px] font-black text-foreground leading-none mb-1">20+</p>
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase leading-snug">highly qualified<br />doctors</p>
                    </div>
                    <div>
                      <p className="text-[28px] font-black text-foreground leading-none mb-1">100%</p>
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase leading-snug">digital<br />diagnostics</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Doctor Image ── */}
          <div className="relative lg:absolute lg:inset-x-0 lg:-bottom-22 z-10 flex justify-center items-end pointer-events-none lg:translate-x-[5%] order-2 lg:order-none h-[40vh] sm:h-[50vh] lg:h-full mt-8 lg:mt-0">
            <div className="relative w-full max-w-[400px] lg:max-w-[1100px] h-full lg:h-[100%]">
              <img
                src="/images/hero-doctor.png"
                alt="Healthcare professional"
                className="w-full h-full object-contain object-bottom"
              />
            </div>
          </div>

          {/* ── RIGHT SIDE (Blue Background Area) ── */}
          <div className="w-full lg:w-[35%] flex flex-col justify-between bg-secondary lg:bg-transparent text-white px-6 sm:px-10 lg:px-0 lg:pl-24 py-12 lg:py-16 pointer-events-auto order-3 lg:order-none rounded-t-[2.5rem] lg:rounded-none -mt-6 lg:mt-0 z-20 relative">
            <div className="lg:pt-24 text-center lg:text-left">
              <h2 className="text-[2rem] sm:text-[2.5rem] font-light leading-[1.1] mb-4 sm:mb-5">
                With Advanced<br />
                <span className="font-semibold">Technologies</span>
              </h2>
              <p className="text-[14px] lg:text-[13px] text-white/80 max-w-[320px] mx-auto lg:mx-0 leading-relaxed">
                The latest <span className="font-semibold text-white">generation equipment</span>, digital diagnostics, advanced techniques — all of this works for your health.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between mt-12 lg:mt-0 pb-4 lg:pb-6 lg:pl-4 gap-6 sm:gap-0">
              <p className="text-[12px] lg:text-[11px] text-white/80 max-w-[200px] lg:max-w-[180px] leading-relaxed text-center sm:text-left">
                We appreciate every feedback, because it inspires us to become better.
              </p>
              <div className="flex items-center gap-4">
                <button className="w-10 h-10 lg:w-8 lg:h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-white" />
                </button>
                <div className="flex -space-x-2">
                  {['A', 'R', 'K'].map((ch, i) => (
                    <div
                      key={ch}
                      className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-white text-secondary border-2 border-secondary flex items-center justify-center text-[11px] lg:text-[10px] font-bold shadow-sm"
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

        {/* ── FLOATING PILLS (Hidden entirely on Mobile/Tablet) ── */}
        <div className="hidden lg:flex absolute top-[56%] left-[32%] z-30 items-center gap-2 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full text-[13px] font-semibold text-foreground shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-gray-100">
            Reliability
          </div>
          <div className="w-10 h-px bg-foreground/20"></div>
          <div className="w-2 h-2 rounded-full border-[2px] border-foreground/30 bg-transparent"></div>
        </div>

        <div className="hidden lg:flex absolute top-[60%] right-[20%] z-30 items-center gap-2 flex-row-reverse pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full text-[13px] font-semibold text-foreground shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-gray-100">
            Experience
          </div>
          <div className="w-10 h-px bg-white/40"></div>
          <div className="w-2 h-2 rounded-full border-[2px] border-white/60 bg-transparent"></div>
        </div>

        <div className="hidden lg:flex absolute top-[80%] right-[18%] z-30 items-center gap-2 flex-row-reverse pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full text-[13px] font-semibold text-foreground shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-gray-100">
            Professional
          </div>
          <div className="w-10 h-px bg-white/40"></div>
          <div className="w-2 h-2 rounded-full border-[2px] border-white/60 bg-transparent"></div>
        </div>
      </section>

      {/* ── SECTIONS ── */}
      <SpecialityMenu />
      <WhyChooseMe />

      {/* ── CTA / BOOKING SECTION ── */}
      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 py-16 relative z-10 bg-background">
        <div className="relative overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] text-white px-6 py-16 lg:py-24 text-center flex flex-col items-center justify-center shadow-lg border border-border/20 bg-primary bg-cover bg-center">
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Join us
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
              Your Health, Our Priority
            </h2>
            <p className="text-[13px] sm:text-sm text-white/90 max-w-md leading-relaxed mb-8 px-4">
              Experience world-class healthcare with experienced doctors, modern facilities, and patient-centered treatment designed for your well-being.
            </p>
            <Link
              href="/user"
              className="inline-flex items-center gap-3 bg-white text-primary hover:bg-neutral-50 px-6 py-3 lg:py-2.5 rounded-full text-[13px] font-bold shadow-md hover-lift transition-all"
            >
              <span>Book an appointment</span>
              <div className="w-7 h-7 lg:w-6 lg:h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                <ArrowRight className="w-3.5 h-3.5 lg:w-3 lg:h-3 rotate-[-45deg]" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}