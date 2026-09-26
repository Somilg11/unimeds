import NextAuth, { CredentialsSignin } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import type { Role } from '@/lib/types';

export const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// Matches the API's JWT lifetime so the session never outlives the backend token
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

type BackendSession = {
  token: string;
  user: { id: string; email: string; name: string; role: Role; avatarUrl: string | null };
};

class BackendAuthError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

function tokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString());
    return typeof payload.exp === 'number' ? payload.exp : 0;
  } catch {
    return 0;
  }
}

async function fetchMe(token: string): Promise<BackendSession['user'] | null> {
  const res = await fetch(`${API_URL}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    // Every email/password, signup, invite and reset flow ends here: the server
    // action obtains a backend token, and this provider turns it into a session.
    Credentials({
      id: 'backend-token',
      credentials: { token: {} },
      async authorize(credentials) {
        const token = typeof credentials?.token === 'string' ? credentials.token : '';
        if (!token) return null;
        const user = await fetchMe(token);
        if (!user) throw new BackendAuthError('Session could not be verified');
        return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl, role: user.role, apiToken: token };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true;
      if (!profile?.email || !INTERNAL_API_KEY) return '/login?error=google';
      return true;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      // Client calls useSession().update({ name, image }) after a profile edit
      if (trigger === 'update' && session) {
        if (typeof session.name === 'string') token.name = session.name;
        if (typeof session.image === 'string' || session.image === null) token.picture = session.image;
        return token;
      }
      if (account?.provider === 'google' && profile) {
        const res = await fetch(`${API_URL}/api/v1/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_API_KEY },
          body: JSON.stringify({
            email: profile.email,
            emailVerified: Boolean(profile.email_verified),
            googleSub: profile.sub ?? account.providerAccountId,
            name: profile.name ?? '',
            picture: typeof profile.picture === 'string' ? profile.picture : null,
          }),
          cache: 'no-store',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new BackendAuthError(body.error || 'Google sign-in failed');
        }
        const data = (await res.json()) as BackendSession;
        token.apiToken = data.token;
        token.apiTokenExp = tokenExpiry(data.token);
        token.uid = data.user.id;
        token.role = data.user.role;
        token.name = data.user.name;
        token.picture = data.user.avatarUrl;
      } else if (user && 'apiToken' in user) {
        const u = user as unknown as { apiToken: string; role: Role; id: string };
        token.apiToken = u.apiToken;
        token.apiTokenExp = tokenExpiry(u.apiToken);
        token.uid = u.id;
        token.role = u.role;
      }
      return token;
    },
    // The backend token stays inside the encrypted cookie; the client session only sees identity + role
    async session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as Role;
      session.expired = typeof token.apiTokenExp === 'number' && token.apiTokenExp * 1000 < Date.now();
      return session;
    },
  },
});
