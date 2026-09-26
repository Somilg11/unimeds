import Link from 'next/link';
import { Logo } from '@/components/app/logo';

const COLUMNS = [
  {
    title: 'Patients',
    links: [
      { href: '/doctors', label: 'Find a doctor' },
      { href: '/clinics', label: 'Browse clinics' },
      { href: '/signup', label: 'Create an account' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    title: 'Clinics',
    links: [
      { href: '/for-clinics', label: 'Unimeds for clinics' },
      { href: '/contact', label: 'Talk to us' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/support', label: 'Support' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/terms', label: 'Terms of service' },
      { href: '/legal/privacy', label: 'Privacy policy' },
      { href: '/legal/security', label: 'Security' },
      { href: '/legal/compliance', label: 'Compliance' },
    ],
  },
];

/** Black footer (inverse token, black in both themes), inset inside the page margin. */
export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <div className="mt-auto px-2 pb-2 sm:px-3 sm:pb-3">
      <footer className="rounded-[2rem] bg-inverse text-inverse-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 pt-12 pb-10 sm:px-8 md:grid-cols-6">
          <div className="col-span-2">
            {/* Inverted mark on black; the regular mark when dark theme flips the footer light */}
            <Logo inverted />
            <p className="mt-4 max-w-xs text-sm text-inverse-foreground/70">
              Book appointments with doctors at clinics near you, and keep your medical records in one place.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-semibold">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.href}`}>
                    <Link href={l.href} className="text-sm text-inverse-foreground/70 transition-colors hover:text-inverse-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="flex flex-col gap-2 border-t border-inverse-foreground/15 py-6 text-xs text-inverse-foreground/70 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {year} Unimeds. All rights reserved.</p>
            <p>Unimeds does not provide medical advice. In an emergency, contact your local emergency services.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
