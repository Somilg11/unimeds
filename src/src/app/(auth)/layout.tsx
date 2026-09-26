import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Unimeds
        </Link>
        <div className="space-y-4">
          <p className="max-w-md text-3xl font-semibold leading-tight">One calm place for patients, doctors and clinics.</p>
          <p className="max-w-md text-primary-foreground/70">
            Book visits, keep records together and run your practice without the paperwork.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} Unimeds</p>
      </aside>
      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
