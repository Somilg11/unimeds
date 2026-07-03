import { ReactNode } from 'react';
import { DashboardNav, DashboardNavItem } from './dashboard-nav';

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: DashboardNavItem[];
  userName: string;
  roleLabel: string;
  logoutHref: string;
}

export function DashboardLayout({ children, navItems, userName, roleLabel, logoutHref }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      <DashboardNav 
        items={navItems} 
        userName={userName} 
        roleLabel={roleLabel} 
        logoutHref={logoutHref} 
      />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="w-full mx-auto max-w-[1400px] p-4 sm:p-6 md:p-8 pt-20 lg:pt-8 animate-in fade-in duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}
