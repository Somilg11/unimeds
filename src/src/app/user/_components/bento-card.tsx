'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function BentoCard({ children, className, title, icon, action }: BentoCardProps) {
  return (
    <div
      className={cn(
        'relative bg-white border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-sm transition-all hover-lift',
        className
      )}
    >
      {(title || icon || action) && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {icon && <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
            {title && (
              <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
                {title}
              </h3>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
