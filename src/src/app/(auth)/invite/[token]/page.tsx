import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { publicApi } from '@/lib/server-api';
import { ROLE_LABEL } from '@/lib/format';
import type { Role } from '@/lib/types';
import { InviteForm } from './invite-form';
import { AuthHeader, FormNotice } from '@/components/auth/form-bits';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Accept invitation · Unimeds' };

type Invite = { email: string; role: Role; clinicName: string | null; expiresAt: string; accountExists: boolean };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await publicApi<Invite>(`/auth/invites/${encodeURIComponent(token)}`).catch(() => null);

  if (!invite) {
    return (
      <div className="space-y-6">
        <AuthHeader
          title="Invitation unavailable"
          description="This link is invalid, has expired, or was already used. Ask your clinic administrator to send a new one."
        />
        <Button asChild variant="outline" size="lg" className="h-12 w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  const session = await auth();
  const signedInAs = session?.user?.email?.toLowerCase() ?? null;
  const mode = !invite.accountExists ? 'create' : signedInAs === invite.email ? 'confirm' : 'sign-in';

  return (
    <div className="space-y-6">
      <AuthHeader
        eyebrow="Invitation"
        title={`Join ${invite.clinicName ?? 'Unimeds'} as ${ROLE_LABEL[invite.role].toLowerCase()}`}
        description={
          <>
            For <span className="font-medium text-foreground">{invite.email}</span>
          </>
        }
      />
      {mode === 'sign-in' ? (
        <div className="space-y-4">
          <FormNotice>
            An account for this email already exists.{' '}
            {signedInAs ? `You're signed in as ${signedInAs}. ` : ''}Sign in as {invite.email} to accept.
          </FormNotice>
          <Button asChild size="lg" className="h-12 w-full">
            <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Sign in to accept</Link>
          </Button>
        </div>
      ) : (
        <InviteForm token={token} create={mode === 'create'} />
      )}
    </div>
  );
}
