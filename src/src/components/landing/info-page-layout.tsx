import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

interface InfoPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function InfoPageLayout({ children, title }: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#0B0A0A] flex flex-col font-sans antialiased">
      <LandingNav />

      <main className="pt-32 flex-1 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-bold uppercase text-[#246AFE] tracking-widest mb-3">
              {title}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0B0A0A]">
              {title}
            </h1>
          </div>
          {children}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
