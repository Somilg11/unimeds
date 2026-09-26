import { Bell, CalendarCheck, FileLock2, Search } from 'lucide-react';
import { IconCircle, SplitHeading } from '@/components/landing/section';

const features = [
  {
    title: 'Real availability',
    description: 'See the times a doctor is actually free at each clinic and pick one that suits you.',
    icon: CalendarCheck,
  },
  {
    title: 'Search that fits you',
    description: 'Look up doctors by name, specialization or city, or find clinics close to where you are.',
    icon: Search,
  },
  {
    title: 'Stay informed',
    description: 'Get notified when your visit is confirmed, moved or cancelled, and respond in a tap.',
    icon: Bell,
  },
  {
    title: 'Your records, your control',
    description: 'Keep reports and prescriptions in one place and choose which visit to share them with.',
    icon: FileLock2,
  },
];

export function WhyChooseMe() {
  return (
    <section aria-labelledby="why-h" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <SplitHeading
        id="why-h"
        eyebrow="Why Unimeds"
        title={
          <>
            Booking a doctor should
            <br className="hidden sm:block" /> feel this simple
          </>
        }
        description="Unimeds connects you with doctors at real clinics. You see their actual open times, book in a few taps and keep every report in one place — without phone calls or paperwork."
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <li key={f.title} className="flex flex-col rounded-3xl bg-card p-6">
            <IconCircle icon={f.icon} />
            <h3 className="mt-6 text-base font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
