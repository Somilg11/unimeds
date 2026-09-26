import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../db/db.js';
import { authTokens, clinicMembers, clinics, users } from '../db/schema.js';
import { authenticate, authUser, requireInternalKey } from '../middleware/auth.js';
import { badRequest, conflict, forbidden, notFound, unauthorized } from '../lib/http.js';
import { hashPassword, hashToken, normalizeEmail, verifyAccessToken, verifyPassword } from '../lib/tokens.js';
import { findUserByEmail, membershipsOf, publicUser, sessionPayload } from '../services/users.js';
import { createPasswordReset } from '../services/invites.js';
import { audit } from '../services/audit.js';
import { notifyClinicAdmins } from '../services/notify.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

const email = z.string().trim().email().max(254).transform(normalizeEmail);
const password = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');
const name = z.string().trim().min(2).max(120);

// Constant-ish timing for unknown users
const DUMMY_HASH = bcrypt.hashSync('unimeds-timing-guard', 12);

router.post('/login', authLimiter, async (req, res) => {
  const body = z.object({ email, password: z.string().min(1).max(128) }).parse(req.body);
  const user = await findUserByEmail(body.email);
  const ok = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) throw unauthorized('Incorrect email or password');
  if (!user.isActive) throw forbidden('This account has been deactivated');
  await audit(req, { action: 'LOGIN', targetType: 'user', targetId: user.id, actor: user, metadata: { method: 'password' } });
  res.json(await sessionPayload(user));
});

// Patient self-signup
router.post('/register', authLimiter, async (req, res) => {
  const body = z.object({ name, email, password }).parse(req.body);
  const existing = await findUserByEmail(body.email);
  if (existing) throw conflict('An account with this email already exists. Try signing in.', 'EMAIL_TAKEN');
  const [user] = await db
    .insert(users)
    .values({ email: body.email, name: body.name, role: 'patient', passwordHash: await hashPassword(body.password) })
    .returning();
  await audit(req, { action: 'USER_REGISTERED', targetType: 'user', targetId: user!.id, actor: user! });
  res.status(201).json(await sessionPayload(user!));
});

// Called only by the Next.js server after Google has verified the identity.
router.post('/google', requireInternalKey, async (req, res) => {
  const body = z
    .object({
      email,
      emailVerified: z.boolean(),
      googleSub: z.string().min(1).max(255),
      name: z.string().max(120).optional().default(''),
      picture: z.string().url().max(1000).optional().nullable(),
    })
    .parse(req.body);
  if (!body.emailVerified) throw forbidden('Your Google email address is not verified');

  let [user] = await db.select().from(users).where(eq(users.googleSub, body.googleSub)).limit(1);
  if (!user) user = await findUserByEmail(body.email);

  if (user) {
    if (user.googleSub && user.googleSub !== body.googleSub) throw forbidden('This email is linked to a different Google account');
    [user] = await db
      .update(users)
      .set({
        googleSub: body.googleSub,
        avatarUrl: user.avatarUrl ?? body.picture ?? null,
        name: user.name || body.name,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
  } else {
    [user] = await db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        role: 'patient',
        googleSub: body.googleSub,
        avatarUrl: body.picture ?? null,
        emailVerifiedAt: new Date(),
      })
      .returning();
    await audit(req, { action: 'USER_REGISTERED', targetType: 'user', targetId: user!.id, actor: user!, metadata: { method: 'google' } });
  }
  if (!user!.isActive) throw forbidden('This account has been deactivated');
  await audit(req, { action: 'LOGIN', targetType: 'user', targetId: user!.id, actor: user!, metadata: { method: 'google' } });
  res.json(await sessionPayload(user!));
});

router.post('/password/forgot', authLimiter, async (req, res) => {
  const body = z.object({ email }).parse(req.body);
  const user = await findUserByEmail(body.email);
  if (user?.isActive) await createPasswordReset(user.id, user.email);
  // Same response either way — don't reveal which emails have accounts
  res.json({ ok: true });
});

async function consumeToken(raw: string, purpose: 'invite' | 'password_reset') {
  const [token] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(raw)),
        eq(authTokens.purpose, purpose),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  return token;
}

router.post('/password/reset', authLimiter, async (req, res) => {
  const body = z.object({ token: z.string().min(10).max(200), password }).parse(req.body);
  const token = await consumeToken(body.token, 'password_reset');
  if (!token?.userId) throw badRequest('This reset link is invalid or has expired', 'TOKEN_INVALID');
  const [user] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(body.password), tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
    .where(eq(users.id, token.userId))
    .returning();
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, token.id));
  await audit(req, { action: 'PASSWORD_RESET', targetType: 'user', targetId: token.userId, actor: user! });
  res.json(await sessionPayload(user!));
});

// --- Invites ----------------------------------------------------------------

router.get('/invites/:token', async (req, res) => {
  const token = await consumeToken(String(req.params.token), 'invite');
  if (!token) throw notFound('This invitation is invalid, expired, or already used');
  const clinic = token.clinicId
    ? (await db.select({ name: clinics.name }).from(clinics).where(eq(clinics.id, token.clinicId)).limit(1))[0]
    : undefined;
  const existing = await findUserByEmail(token.email);
  res.json({
    email: token.email,
    role: token.role,
    clinicName: clinic?.name ?? null,
    expiresAt: token.expiresAt,
    accountExists: Boolean(existing),
  });
});

/**
 * Accepts an invite. New users choose a name + password. If an account with
 * the invited email already exists, the caller must be signed in as that user
 * (so an inviter can never take over an existing account).
 */
router.post('/invites/accept', authLimiter, async (req, res) => {
  const body = z
    .object({ token: z.string().min(10).max(200), name: name.optional(), password: password.optional() })
    .parse(req.body);
  const invite = await consumeToken(body.token, 'invite');
  if (!invite || !invite.role) throw badRequest('This invitation is invalid, expired, or already used', 'TOKEN_INVALID');

  let user = await findUserByEmail(invite.email);
  if (user) {
    const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    let signedInAs: string | null = null;
    try {
      signedInAs = bearer ? verifyAccessToken(bearer).sub : null;
    } catch {
      signedInAs = null;
    }
    if (signedInAs !== user.id) {
      throw conflict(`An account for ${invite.email} already exists. Sign in with it to accept this invitation.`, 'SIGN_IN_REQUIRED');
    }
    if (user.role !== invite.role && user.role !== 'patient') {
      throw conflict(`This account is already registered as ${user.role.replace('_', ' ')} and cannot also be ${invite.role.replace('_', ' ')}. Use a different email.`, 'ROLE_CONFLICT');
    }
  } else if (!body.name || !body.password) {
    throw badRequest('Name and password are required to create your account');
  }

  const result = await db.transaction(async (tx) => {
    if (user) {
      if (user.role !== invite.role) {
        [user] = await tx.update(users).set({ role: invite.role!, updatedAt: new Date() }).where(eq(users.id, user.id)).returning();
      }
    } else {
      [user] = await tx
        .insert(users)
        .values({
          email: invite.email,
          name: body.name!,
          role: invite.role!,
          passwordHash: await hashPassword(body.password!),
          emailVerifiedAt: new Date(),
        })
        .returning();
    }
    const u = user!;

    if (invite.clinicId && (invite.role === 'doctor' || invite.role === 'clinic_admin')) {
      await tx
        .insert(clinicMembers)
        .values({ clinicId: invite.clinicId, userId: u.id, role: invite.role, invitedBy: invite.createdBy, isActive: true })
        .onConflictDoUpdate({
          target: [clinicMembers.clinicId, clinicMembers.userId, clinicMembers.role],
          set: { isActive: true },
        });
      // First admin accepting activates an invited clinic
      if (invite.role === 'clinic_admin') {
        await tx
          .update(clinics)
          .set({ status: 'active', activatedAt: new Date(), updatedAt: new Date() })
          .where(and(eq(clinics.id, invite.clinicId), eq(clinics.status, 'invited')));
      }
    }
    await tx.update(authTokens).set({ usedAt: new Date(), userId: u.id }).where(eq(authTokens.id, invite.id));
    return u;
  });

  if (invite.clinicId) {
    await notifyClinicAdmins(invite.clinicId, {
      type: 'membership',
      title: 'Invitation accepted',
      message: `${result.name || result.email} joined as ${invite.role === 'doctor' ? 'a doctor' : 'an administrator'}.`,
      link: '/clinic/team',
    });
  }
  await audit(req, {
    action: 'INVITE_ACCEPTED',
    actor: result,
    targetType: 'user',
    targetId: result.id,
    clinicId: invite.clinicId,
    metadata: { role: invite.role },
  });
  res.json(await sessionPayload(result));
});

// --- Session ----------------------------------------------------------------

router.get('/me', authenticate, async (req, res) => {
  const me = authUser(req);
  const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!user) throw unauthorized();
  res.json({ user: { ...publicUser(user), memberships: await membershipsOf(user.id) } });
});

router.post('/password/change', authenticate, async (req, res) => {
  const body = z.object({ currentPassword: z.string().max(128).optional(), newPassword: password }).parse(req.body);
  const me = authUser(req);
  const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!user) throw unauthorized();
  if (user.passwordHash && !(await verifyPassword(body.currentPassword ?? '', user.passwordHash))) {
    throw badRequest('Current password is incorrect', 'WRONG_PASSWORD');
  }
  const [updated] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(body.newPassword), tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();
  await audit(req, { action: 'PASSWORD_CHANGED', targetType: 'user', targetId: user.id });
  // Other sessions are revoked; hand back a fresh token for this one
  res.json(await sessionPayload(updated!));
});

router.post('/logout-all', authenticate, async (req, res) => {
  const me = authUser(req);
  await db.update(users).set({ tokenVersion: sql`${users.tokenVersion} + 1` }).where(eq(users.id, me.id));
  await audit(req, { action: 'SESSIONS_REVOKED', targetType: 'user', targetId: me.id });
  res.json({ ok: true });
});

export default router;
