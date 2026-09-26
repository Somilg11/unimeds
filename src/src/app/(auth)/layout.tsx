import Link from 'next/link';
import { CalendarCheck, FileLock2, Stethoscope } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { ThemeToggle } from '@/components/app/theme-toggle';

const BENEFITS = [
  { icon: Stethoscope, text: 'Find doctors at clinics near you' },
  { icon: CalendarCheck, text: 'Book from their real open times' },
  { icon: FileLock2, text: 'Keep your records private and in one place' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background p-2 sm:p-3 lg:grid lg:grid-cols-2 lg:gap-3">
      <aside className="hidden flex-col justify-between rounded-[2rem] bg-brand p-10 text-brand-foreground lg:flex xl:p-14">
        <Logo inverted />
        <div className="max-w-md space-y-8">
          <h2 className="text-4xl leading-[1.1] font-bold tracking-tight xl:text-5xl">One calm place for your care.</h2>
          <p className="text-brand-foreground/80">Patients book visits, doctors keep their schedule and clinics run their practice — all on Unimeds.</p>
          <ul className="space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-sm font-medium">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                  <b.icon className="size-4" />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-brand-foreground/70">© {new Date().getFullYear()} Unimeds</p>
      </aside>

      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between px-2 pt-1 lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 sm:p-8">{children}</div>
        </main>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1 pb-3 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Help
          </Link>
        </nav>
      </div>
    </div>
  );
}
