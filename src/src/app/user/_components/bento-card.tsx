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
        'relative bg-white border border-gray-200 p-6',
        'transition-colors hover:bg-gray-50/50',
        className
      )}
    >
      {(title || icon || action) && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {icon && <div className="text-blue-600">{icon}</div>}
            {title && (
              <h3 className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
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
