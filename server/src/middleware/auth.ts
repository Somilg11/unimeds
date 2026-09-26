import type { Request, Response, NextFunction } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { users, clinicMembers, clinics, type UserRole } from '../db/schema.js';
import { verifyAccessToken, safeEqual } from '../lib/tokens.js';
import { env } from '../lib/env.js';
import { forbidden, unauthorized } from '../lib/http.js';

export type AuthUser = { id: string; role: UserRole; email: string; name: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      clinicId?: string;
    }
  }
}

export function authUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}

export function scopedClinicId(req: Request): string {
  if (!req.clinicId) throw forbidden('No active clinic for this account');
  return req.clinicId;
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return next(unauthorized());

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const expired = (err as { name?: string }).name === 'TokenExpiredError';
    return next(unauthorized(expired ? 'Session expired, please sign in again' : 'Invalid session'));
  }

  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      email: users.email,
      name: users.name,
      isActive: users.isActive,
      tokenVersion: users.tokenVersion,
    })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  // Deactivated users and revoked sessions (password change, sign-out-everywhere) are rejected
  if (!user || !user.isActive || user.tokenVersion !== payload.ver) {
    return next(unauthorized('Session is no longer valid, please sign in again'));
  }

  req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
  next();
};

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };

// Resolves the clinic a clinic admin is operating on. Admins with several
// clinics pick one via the X-Clinic-Id header; otherwise the oldest membership wins.
export const resolveAdminClinic = async (req: Request, _res: Response, next: NextFunction) => {
  const user = authUser(req);
  const requested = req.header('x-clinic-id');

  const memberships = await db
    .select({ clinicId: clinicMembers.clinicId })
    .from(clinicMembers)
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(
      and(
        eq(clinicMembers.userId, user.id),
        eq(clinicMembers.role, 'clinic_admin'),
        eq(clinicMembers.isActive, true),
        eq(clinics.status, 'active')
      )
    )
    .orderBy(asc(clinicMembers.joinedAt));

  const match = requested ? memberships.find((m) => m.clinicId === requested) : memberships[0];
  if (!match) return next(forbidden('Your clinic is not active or you are not a member of it'));
  req.clinicId = match.clinicId;
  next();
};

// Server-to-server calls from the Next.js backend (e.g. Google identity exchange)
export const requireInternalKey = (req: Request, _res: Response, next: NextFunction) => {
  const key = req.header('x-internal-key') || '';
  if (!key || !safeEqual(key, env.internalApiKey)) return next(forbidden('Internal endpoint'));
  next();
};
