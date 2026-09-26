import type { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    expired?: boolean;
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    role?: Role;
    apiToken?: string;
    apiTokenExp?: number;
  }
}
