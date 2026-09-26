import { CalendarCheck, FileLock2, Search, Bell } from 'lucide-react';

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
    <section aria-labelledby="why-h" className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="why-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Why patients use Unimeds
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
