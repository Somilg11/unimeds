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
        'relative overflow-hidden bg-white border border-zinc-200 rounded-xl p-6',
        'shadow-premium transition-all duration-300',
        'hover:border-zinc-300 hover:shadow-lg group',
        className
      )}
    >
      {(title || icon || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && <div className="text-zinc-700">{icon}</div>}
            {title && (
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">
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
