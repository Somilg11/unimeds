import { and, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { clinicMembers, clinics, users, type User } from '../db/schema.js';
import { signAccessToken } from '../lib/tokens.js';

export async function membershipsOf(userId: string) {
  return db
    .select({
      clinicId: clinics.id,
      clinicName: clinics.name,
      clinicStatus: clinics.status,
      timezone: clinics.timezone,
      role: clinicMembers.role,
      isActive: clinicMembers.isActive,
    })
    .from(clinicMembers)
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(eq(clinicMembers.userId, userId));
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    profile: user.profile ?? {},
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt,
  };
}

export async function sessionPayload(user: User) {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  return {
    token: signAccessToken(user),
    user: { ...publicUser(user), memberships: await membershipsOf(user.id) },
  };
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function activeMembership(userId: string, clinicId: string, role: 'doctor' | 'clinic_admin') {
  const [m] = await db
    .select()
    .from(clinicMembers)
    .where(and(eq(clinicMembers.userId, userId), eq(clinicMembers.clinicId, clinicId), eq(clinicMembers.role, role)))
    .limit(1);
  return m;
}
