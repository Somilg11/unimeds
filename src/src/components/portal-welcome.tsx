import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface PortalWelcomeProps {
  /** Portal name, e.g. "Patient Portal" */
  title: string;
  /** Short tagline shown under the title */
  subtitle: string;
  /** Longer supporting description */
  description: string;
  icon: LucideIcon;
  /** Server action that triggers Google sign-in for this portal */
  signInAction: () => Promise<void>;
}

/**
 * Public welcome screen for a portal. Renders a sign-in button that kicks off
 * the portal-specific Google login flow (which lands on that portal's dashboard).
 */
export function PortalWelcome({
  title,
  subtitle,
  description,
  icon: Icon,
  signInAction,
}: PortalWelcomeProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center h-12">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </nav>

      {/* Centered welcome card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-sm animate-subtle">
          <CardHeader className="p-6 text-center">
            <div className="w-12 h-12 bg-muted mb-4 mx-auto flex items-center justify-center">
              <Icon className="w-6 h-6 text-foreground" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm font-medium text-foreground/80 mt-1">{subtitle}</p>
            <CardDescription className="text-sm mt-2">{description}</CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <form action={signInAction}>
              <Button type="submit" className="w-full hover-lift">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm">Sign In with Google</span>
              </Button>
            </form>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
