import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ROLE_HOME, portalFor } from '@/lib/roles';

const AUTH_PAGES = ['/login', '/signup', '/forgot-password'];

// Optimistic gate: the API enforces authorization on every request regardless.
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;
  const signedIn = Boolean(session?.user?.role) && !session?.expired;

  const portal = portalFor(pathname);
  if (portal) {
    if (!signedIn) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname + search);
      if (session?.expired) url.searchParams.set('expired', '1');
      return NextResponse.redirect(url);
    }
    if (session!.user.role !== portal.role) {
      return NextResponse.redirect(new URL(ROLE_HOME[session!.user.role], req.url));
    }
  }

  if (signedIn && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session!.user.role], req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/patient/:path*', '/doctor/:path*', '/clinic/:path*', '/admin/:path*', '/login', '/signup', '/forgot-password'],
};
