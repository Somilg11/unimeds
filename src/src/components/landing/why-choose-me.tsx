'use client';

import { HandHeart, ShieldCheck, Navigation, HeartPulse } from 'lucide-react';

const features = [
  {
    title: 'Patient-Focused Care',
    description:
      'Every patient receives personalized attention with treatment plans tailored to their specific health needs.',
    icon: HandHeart,
  },
  {
    title: 'Clinical Accuracy',
    description:
      'All diagnoses and treatments follow modern medical guidelines and proven clinical practices.',
    icon: ShieldCheck,
  },
  {
    title: 'Clear Guidance',
    description:
      'Medical conditions and treatment options are explained in a simple, clear, and understandable way.',
    icon: Navigation,
  },
  {
    title: 'Compassionate Care',
    description:
      'Patients are treated with respect, empathy, and genuine concern for their long-term well-being.',
    icon: HeartPulse,
  },
];

export function WhyChooseMe() {
  return (
    <section className="bg-background px-6 py-24 sm:px-12 lg:px-20 border-t border-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Why Choose Us
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            Trusted medical care focused on accuracy, compassion, and your long-term health.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col rounded-[2rem] bg-white border border-gray-100 p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:bg-primary"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-gray-100 transition-transform duration-300 group-hover:scale-105 shadow-sm">
                <feature.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>

              <h3 className="mb-3 text-lg font-bold tracking-tight text-foreground group-hover:text-white transition-colors">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-white/80 transition-colors">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
