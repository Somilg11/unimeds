'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ComponentProps, ReactNode } from 'react';

interface LogoutButtonProps {
  /** Where to send the user after logging out, e.g. "/user", "/doctor". */
  redirectTo: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  className?: string;
  /** Custom label/content. Defaults to an icon + "Logout". */
  children?: ReactNode;
  /** Custom logout handler. If provided, skips next-auth signOut. */
  onLogout?: () => void;
}

/**
 * General-purpose logout button. Signs the user out and redirects to the
 * portal welcome page passed via `redirectTo`.
 */
export function LogoutButton({
  redirectTo,
  variant = 'outline',
  size,
  className,
  children,
  onLogout,
}: LogoutButtonProps) {
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    await signOut({ callbackUrl: redirectTo });
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={cn('rounded-none border border-dashed border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600', className)}
    >
      {children ?? (
        <>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </>
      )}
    </Button>
  );
}
