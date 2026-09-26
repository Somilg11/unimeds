import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { googleAction } from '../actions';
import { Button } from '@/components/ui/button';
import { AuthHeader, FormNotice } from '@/components/auth/form-bits';

export const metadata: Metadata = { title: 'Sign in · Unimeds' };

const ERRORS: Record<string, string> = {
  google: 'Google sign-in failed. Please try again.',
  CredentialsSignin: 'Could not sign you in. Please try again.',
  AccessDenied: 'Access denied.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { next, expired, error } = await searchParams;
  return (
    <div className="space-y-6">
      <AuthHeader title="Welcome back" description="Sign in to your patient, doctor or clinic account." />
      {expired && <FormNotice>Your session ended. Please sign in again.</FormNotice>}
      {error && (
        <p role="alert" className="rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {ERRORS[error] ?? 'Sign-in failed.'}
        </p>
      )}

      <form action={googleAction}>
        <input type="hidden" name="next" value={next ? `/login/continue?next=${encodeURIComponent(next)}` : ''} />
        <Button type="submit" variant="outline" size="lg" className="h-12 w-full">
          <GoogleIcon /> Continue with Google
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <LoginForm next={next} />

      <p className="text-center text-sm text-muted-foreground">
        New patient?{' '}
        <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} className="font-semibold text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="rounded-3xl bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
        Doctors and clinic staff join by invitation from their clinic.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}
