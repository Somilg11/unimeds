import type { Role } from '@/lib/types';

export const ROLE_HOME: Record<Role, string> = {
  patient: '/patient',
  doctor: '/doctor',
  clinic_admin: '/clinic',
  super_admin: '/admin',
};

// Portal prefix → role allowed in it
export const PORTALS: Array<{ prefix: string; role: Role }> = [
  { prefix: '/patient', role: 'patient' },
  { prefix: '/doctor', role: 'doctor' },
  { prefix: '/clinic', role: 'clinic_admin' },
  { prefix: '/admin', role: 'super_admin' },
];

export function portalFor(pathname: string) {
  return PORTALS.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`));
}

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null | undefined, role?: Role): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    const portal = portalFor(next);
    if (!portal || !role || portal.role === role) return next;
  }
  return role ? ROLE_HOME[role] : '/';
}
