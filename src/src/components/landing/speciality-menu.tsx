// 'use client';

// import Link from 'next/link';
// import {
//   Stethoscope,
//   Heart,
//   Sparkles,
//   Baby,
//   Brain,
//   Activity,
//   LucideIcon,
// } from 'lucide-react';
// const slugifySpeciality = (text: string) => {
//   return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
// };

// type SpecialityItem = {
//   speciality: string;
//   icon: LucideIcon;
// };

// const specialityData: SpecialityItem[] = [
//   { speciality: 'General physician', icon: Stethoscope },
//   { speciality: 'Gynecologist', icon: Heart },
//   { speciality: 'Dermatologist', icon: Sparkles },
//   { speciality: 'Pediatricians', icon: Baby },
//   { speciality: 'Neurologist', icon: Brain },
//   { speciality: 'Gastroenterologist', icon: Activity },
// ];

// export function SpecialityMenu() {
//   return (
//     <section
//       className="flex flex-col items-center gap-4 py-20 text-foreground border-t border-muted/30 bg-background"
//       id="speciality"
//     >
//       <h2 className="text-3xl font-bold tracking-tight text-foreground">Find by Speciality</h2>
//       <p className="sm:w-1/2 text-center text-sm text-muted-foreground px-4 leading-relaxed">
//         Simply browse through our extensive list of trusted doctors, and schedule
//         <br className="hidden sm:block" /> your appointment hassle-free.
//       </p>

//       <div className="flex sm:justify-center gap-6 pt-8 w-full overflow-x-auto px-4 pb-4">
//         {specialityData.map((item) => (
//           <Link
//             key={item.speciality}
//             href={`/doctors/${slugifySpeciality(item.speciality)}`}
//             onClick={() => {
//               if (typeof window !== 'undefined') {
//                 window.scrollTo({ top: 0, behavior: 'smooth' });
//               }
//             }}
//             className="group flex flex-col items-center text-xs font-medium text-muted-foreground cursor-pointer shrink-0 hover:text-primary transition-colors"
//           >
//             <div className="w-16 h-16 sm:w-22 sm:h-22 mb-3 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
//               <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" strokeWidth={1.5} />
//             </div>
//             <p className="transition-transform duration-300 group-hover:translate-y-0.5">{item.speciality}</p>
//           </Link>
//         ))}
//       </div>
//     </section>
//   );
// }

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

const slugifySpeciality = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

type SpecialityItem = {
  speciality: string;
  icon: LucideIcon;
};

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
      className="flex flex-col items-center gap-3 sm:gap-4 py-12 sm:py-16 lg:py-20 text-foreground border-t border-muted/30 bg-background"
      id="speciality"
    >
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-center">
        Find by Speciality
      </h2>
      <p className="w-full sm:w-2/3 lg:w-1/2 text-center text-xs sm:text-sm text-muted-foreground px-4 leading-relaxed max-w-[600px]">
        Simply browse through our extensive list of trusted doctors, and schedule
        <br className="hidden sm:block" /> your appointment hassle-free.
      </p>

      {/* Scroll container with snap-scrolling for mobile, 
        plus standard custom classes to hide the scrollbar.
      */}
      <div className="flex sm:justify-center gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8 w-full overflow-x-auto px-6 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {specialityData.map((item) => (
          <Link
            key={item.speciality}
            href={`/doctors/${slugifySpeciality(item.speciality)}`}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="group flex flex-col items-center text-[11px] sm:text-xs font-medium text-muted-foreground cursor-pointer shrink-0 hover:text-primary transition-colors snap-center"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-2 sm:mb-3 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
              <item.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" strokeWidth={1.5} />
            </div>
            <p className="transition-transform duration-300 group-hover:translate-y-0.5 whitespace-nowrap">
              {item.speciality}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}