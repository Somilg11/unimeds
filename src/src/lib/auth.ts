import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || 'dev-secret',
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        token.id = user.id ?? '';
        token.authId = account.providerAccountId;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // Call our backend to get a JWT that the backend can verify
        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              picture: user.image,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.token;
            token.dbUserId = data.user?.id;
            token.userRole = data.user?.role;
          }
        } catch (error) {
          console.error('Failed to authenticate with backend:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.dbUserId as string) || (token.id as string);
        session.user.authId = token.authId as string;
        session.accessToken = token.accessToken as string;
        Object.assign(session.user, { email: token.email as string, role: token.userRole as string });
      }
      return session;
    },
    async signIn() {
      return true;
    },
  },
});
