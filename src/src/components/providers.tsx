'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>{children}</SessionProvider>
      <Toaster richColors position="top-right" />
    </>
  );
}
