import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      authId: string;
      role?: string;
    };
  }

  interface User {
    id: string;
    authId: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    authId: string;
    role?: string;
  }
}
