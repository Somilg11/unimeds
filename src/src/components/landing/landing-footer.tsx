import Link from 'next/link';

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

export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2" aria-label="Unimeds home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/unimeds_logo.png" alt="" className="size-7 rounded-lg object-contain" />
            <span className="font-semibold tracking-tight">Unimeds</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Book appointments with doctors at clinics near you, and keep your medical records in one place.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={`${col.title}-${l.href}`}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>&copy; {year} Unimeds. All rights reserved.</p>
          <p>Unimeds does not provide medical advice. In an emergency, contact your local emergency services.</p>
        </div>
      </div>
    </footer>
  );
}
