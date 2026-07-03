'use client';

import Link from 'next/link';
import {
  Stethoscope,
  Heart,
  Sparkles,
  Baby,
  Brain,
  Activity,
  LucideIcon,
} from 'lucide-react';
type SpecialityItem = {
  speciality: string;
  icon: LucideIcon;
};

export function slugifySpeciality(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

const specialityData: SpecialityItem[] = [
  { speciality: 'General physician', icon: Stethoscope },
  { speciality: 'Gynecologist', icon: Heart },
  { speciality: 'Dermatologist', icon: Sparkles },
  { speciality: 'Pediatricians', icon: Baby },
  { speciality: 'Neurologist', icon: Brain },
  { speciality: 'Gastroenterologist', icon: Activity },
];

export function SpecialityMenu() {
  return (
    <section
      className="flex flex-col items-center gap-4 py-20 text-[#0B0A0A] border-t border-[#d4e1f7] bg-[#EBF0FE]/50"
      id="speciality"
    >
      <h2 className="text-3xl font-bold tracking-tight text-[#0B0A0A]">Find by Speciality</h2>
      <p className="sm:w-1/2 text-center text-sm text-[#0B0A0A]/70 px-4 leading-relaxed">
        Simply browse through our extensive list of trusted doctors, and schedule
        <br className="hidden sm:block" /> your appointment hassle-free.
      </p>

      <div className="flex sm:justify-center gap-6 pt-8 w-full overflow-x-auto px-4 pb-4">
        {specialityData.map((item) => (
          <Link
            key={item.speciality}
            href={`/doctors/${slugifySpeciality(item.speciality)}`}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="group flex flex-col items-center text-xs font-medium text-[#0B0A0A]/80 cursor-pointer shrink-0 hover:text-[#246AFE] transition-colors"
          >
            <div className="w-16 h-16 sm:w-22 sm:h-22 mb-3 rounded-full bg-white border border-[#d4e1f7] flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105">
              <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#246AFE]" strokeWidth={1.5} />
            </div>
            <p className="transition-transform duration-300 group-hover:translate-y-0.5">{item.speciality}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
