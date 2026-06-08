import { signInWithGoogle } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Stethoscope, Building2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md border-border/50 shadow-sm animate-subtle">
        <CardHeader className="p-4 sm:p-6 text-center">
          <CardTitle className="text-xl sm:text-2xl">Sign In</CardTitle>
          <CardDescription className="text-sm">Access your UniMeds dashboard</CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              variant="outline"
              className="w-full hover-lift"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
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
              <span className="text-xs sm:text-sm">Sign in with Google</span>
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <Separator className="my-4 sm:my-6" />

          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Quick Access (Demo)</p>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="secondary" size="sm" className="text-[10px] sm:text-xs">
                <Link href="/user" className="flex items-center justify-center gap-1">
                  <LayoutDashboard className="w-3 h-3" />
                  Patient
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="text-[10px] sm:text-xs">
                <Link href="/doctor" className="flex items-center justify-center gap-1">
                  <Stethoscope className="w-3 h-3" />
                  Doctor
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="text-[10px] sm:text-xs">
                <Link href="/clinic" className="flex items-center justify-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Clinic
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="text-[10px] sm:text-xs">
                <Link href="/admin" className="flex items-center justify-center gap-1">
                  <User className="w-3 h-3" />
                  Super Admin
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
