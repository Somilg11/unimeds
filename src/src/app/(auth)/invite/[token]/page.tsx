import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { publicApi } from '@/lib/server-api';
import { ROLE_LABEL } from '@/lib/format';
import type { Role } from '@/lib/types';
import { InviteForm } from './invite-form';

export const metadata: Metadata = { title: 'Accept invitation · Unimeds' };

type Invite = { email: string; role: Role; clinicName: string | null; expiresAt: string; accountExists: boolean };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await publicApi<Invite>(`/auth/invites/${encodeURIComponent(token)}`).catch(() => null);

  if (!invite) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Invitation unavailable</h1>
        <p className="text-sm text-muted-foreground">
          This link is invalid, has expired, or was already used. Ask your clinic administrator to send a new one.
        </p>
        <Link href="/login" className="text-sm underline">Go to sign in</Link>
      </div>
    );
  }

  const session = await auth();
  const signedInAs = session?.user?.email?.toLowerCase() ?? null;
  const mode = !invite.accountExists ? 'create' : signedInAs === invite.email ? 'confirm' : 'sign-in';

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Invitation</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Join {invite.clinicName ?? 'Unimeds'} as {ROLE_LABEL[invite.role].toLowerCase()}
        </h1>
        <p className="text-sm text-muted-foreground">
          For <span className="font-medium text-foreground">{invite.email}</span>
        </p>
      </div>
      {mode === 'sign-in' ? (
        <div className="space-y-4 text-sm">
          <p>
            An account for this email already exists.{' '}
            {signedInAs ? `You're signed in as ${signedInAs}. ` : ''}Sign in as {invite.email} to accept.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
          >
            Sign in to accept
          </Link>
        </div>
      ) : (
        <InviteForm token={token} create={mode === 'create'} />
      )}
    </div>
  );
}
