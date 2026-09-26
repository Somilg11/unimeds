import { Router } from 'express';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { and, asc, count, desc, eq, gt, gte, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/db.js';
import { appointments, auditLogs, authTokens, clinicMembers, clinics, records, users } from '../db/schema.js';
import { authenticate, authorize, authUser } from '../middleware/auth.js';
import { badRequest, conflict, notFound, pageParams, paged } from '../lib/http.js';
import { normalizeEmail } from '../lib/tokens.js';
import { createInvite } from '../services/invites.js';
import { clinicSettings } from '../services/scheduling.js';
import { findUserByEmail, publicUser } from '../services/users.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(authenticate, authorize('super_admin'));

const uuid = z.string().uuid();
const like = (v: string) => `%${v.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

// --- Overview -------------------------------------------------------------------

router.get('/overview', async (_req, res) => {
  const [u] = await db
    .select({
      patients: sql<number>`count(*) filter (where ${users.role} = 'patient')::int`,
      doctors: sql<number>`count(*) filter (where ${users.role} = 'doctor')::int`,
      admins: sql<number>`count(*) filter (where ${users.role} = 'clinic_admin')::int`,
      newLast30: sql<number>`count(*) filter (where ${users.createdAt} >= now() - interval '30 days')::int`,
    })
    .from(users);
  const [c] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${clinics.status} = 'active')::int`,
      invited: sql<number>`count(*) filter (where ${clinics.status} = 'invited')::int`,
      suspended: sql<number>`count(*) filter (where ${clinics.status} = 'suspended')::int`,
    })
    .from(clinics);
  const [a] = await db
    .select({
      total: sql<number>`count(*)::int`,
      last30: sql<number>`count(*) filter (where ${appointments.createdAt} >= now() - interval '30 days')::int`,
      completed: sql<number>`count(*) filter (where ${appointments.status} = 'completed')::int`,
    })
    .from(appointments);
  const [r] = await db.select({ n: count() }).from(records);

  const since = DateTime.utc().startOf('day').minus({ days: 29 });
  const dayExpr = sql<string>`to_char(date_trunc('day', ${appointments.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
  const daily = await db
    .select({ day: dayExpr, bookings: sql<number>`count(*)::int` })
    .from(appointments)
    .where(gte(appointments.createdAt, since.toJSDate()))
    .groupBy(dayExpr);
  const signupExpr = sql<string>`to_char(date_trunc('day', ${users.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
  const signups = await db
    .select({ day: signupExpr, signups: sql<number>`count(*)::int` })
    .from(users)
    .where(gte(users.createdAt, since.toJSDate()))
    .groupBy(signupExpr);
  const activity = Array.from({ length: 30 }, (_, i) => {
    const day = since.plus({ days: i }).toISODate()!;
    return {
      day,
      bookings: daily.find((d) => d.day === day)?.bookings ?? 0,
      signups: signups.find((d) => d.day === day)?.signups ?? 0,
    };
  });

  res.json({ users: u, clinics: c, appointments: a, records: r?.n ?? 0, activity });
});

// --- Clinics (tenants) ------------------------------------------------------------

router.get('/clinics', async (req, res) => {
  const q = z.object({ q: z.string().trim().max(100).optional(), status: z.enum(clinics.status.enumValues).optional() }).parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [];
  if (q.status) conds.push(eq(clinics.status, q.status));
  if (q.q) conds.push(or(sql`${clinics.name} ilike ${like(q.q)}`, sql`${clinics.email} ilike ${like(q.q)}`, sql`${clinics.city} ilike ${like(q.q)}`)!);
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select({
      id: clinics.id,
      name: clinics.name,
      slug: clinics.slug,
      email: clinics.email,
      city: clinics.city,
      status: clinics.status,
      plan: clinics.plan,
      timezone: clinics.timezone,
      createdAt: clinics.createdAt,
      activatedAt: clinics.activatedAt,
      doctors: sql<number>`(select count(*)::int from clinic_members m where m.clinic_id = "clinics"."id" and m.role = 'doctor' and m.is_active)`,
      admins: sql<number>`(select count(*)::int from clinic_members m where m.clinic_id = "clinics"."id" and m.role = 'clinic_admin' and m.is_active)`,
      appointments30d: sql<number>`(select count(*)::int from appointments a where a.clinic_id = "clinics"."id" and a.created_at >= now() - interval '30 days')`,
    })
    .from(clinics)
    .where(where)
    .orderBy(desc(clinics.createdAt))
    .limit(limit)
    .offset(offset);
  const [total] = await db.select({ n: count() }).from(clinics).where(where);
  res.json(paged(rows, total?.n ?? 0, page, pageSize));
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'clinic'
  );
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const [hit] = await db.select({ id: clinics.id }).from(clinics).where(eq(clinics.slug, candidate)).limit(1);
    if (!hit) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

const validTimezone = z.string().refine((tz) => DateTime.local().setZone(tz).isValid, 'Unknown timezone');

router.post('/clinics', async (req, res) => {
  const body = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().transform(normalizeEmail),
      phone: z.string().trim().max(30).optional(),
      address: z.string().trim().max(300).optional(),
      city: z.string().trim().max(100).optional(),
      state: z.string().trim().max(100).optional(),
      zipCode: z.string().trim().max(20).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      timezone: validTimezone.default('Asia/Kolkata'),
      plan: z.enum(['starter', 'growth', 'enterprise']).default('starter'),
    })
    .parse(req.body);

  const [dupe] = await db.select({ id: clinics.id }).from(clinics).where(eq(clinics.email, body.email)).limit(1);
  if (dupe) throw conflict('A clinic with this email already exists', 'EMAIL_TAKEN');
  const owner = await findUserByEmail(body.email);
  if (owner && owner.role !== 'patient' && owner.role !== 'clinic_admin') {
    throw conflict(`${body.email} is registered as ${owner.role.replace('_', ' ')}. Use a different admin email.`, 'ROLE_CONFLICT');
  }

  const [clinic] = await db
    .insert(clinics)
    .values({ ...body, slug: await uniqueSlug(body.name), status: 'invited' })
    .returning();
  const result = await createInvite({ email: body.email, role: 'clinic_admin', clinicId: clinic!.id, clinicName: clinic!.name, createdBy: authUser(req).id });
  await audit(req, { action: 'CLINIC_CREATED', targetType: 'clinic', targetId: clinic!.id, clinicId: clinic!.id, metadata: { name: body.name, email: body.email } });
  res.status(201).json({ clinic: clinic!, inviteUrl: result.inviteUrl, emailSent: result.emailSent });
});

router.get('/clinics/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
  if (!clinic) throw notFound('Clinic not found');
  const members = await db
    .select({
      id: clinicMembers.id,
      role: clinicMembers.role,
      isActive: clinicMembers.isActive,
      joinedAt: clinicMembers.joinedAt,
      user: { id: users.id, name: users.name, email: users.email, isActive: users.isActive },
    })
    .from(clinicMembers)
    .innerJoin(users, eq(users.id, clinicMembers.userId))
    .where(eq(clinicMembers.clinicId, id))
    .orderBy(asc(clinicMembers.role), asc(users.name));
  const invites = await db
    .select({ id: authTokens.id, email: authTokens.email, role: authTokens.role, expiresAt: authTokens.expiresAt, createdAt: authTokens.createdAt })
    .from(authTokens)
    .where(and(eq(authTokens.clinicId, id), eq(authTokens.purpose, 'invite'), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .orderBy(desc(authTokens.createdAt));
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      upcoming: sql<number>`count(*) filter (where ${appointments.startsAt} >= now() and ${appointments.status} in ('pending','confirmed','reschedule_proposed'))::int`,
      patients: sql<number>`count(distinct ${appointments.patientId})::int`,
    })
    .from(appointments)
    .where(eq(appointments.clinicId, id));
  res.json({ clinic: { ...clinic, settings: clinicSettings(clinic) }, members, invites, stats });
});

router.patch('/clinics/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const body = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      plan: z.enum(['starter', 'growth', 'enterprise']).optional(),
      status: z.enum(['active', 'suspended']).optional(),
      timezone: validTimezone.optional(),
    })
    .strict()
    .parse(req.body);
  const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
  if (!clinic) throw notFound('Clinic not found');
  if (body.status === 'active' && clinic.status !== 'active') {
    // A tenant can only be live with an owner: activation normally happens when its admin accepts the invite
    const [admin] = await db
      .select({ id: clinicMembers.id })
      .from(clinicMembers)
      .where(and(eq(clinicMembers.clinicId, id), eq(clinicMembers.role, 'clinic_admin'), eq(clinicMembers.isActive, true)))
      .limit(1);
    if (!admin) {
      throw badRequest('This clinic has no active administrator yet. Resend the owner invite instead.', 'NO_ADMIN');
    }
  }
  const [updated] = await db
    .update(clinics)
    .set({ ...body, updatedAt: new Date(), ...(body.status === 'active' && !clinic.activatedAt ? { activatedAt: new Date() } : {}) })
    .where(eq(clinics.id, id))
    .returning();
  const action = body.status === 'suspended' ? 'CLINIC_SUSPENDED' : body.status === 'active' ? 'CLINIC_REACTIVATED' : 'CLINIC_UPDATED';
  await audit(req, { action, targetType: 'clinic', targetId: id, clinicId: id, metadata: { changes: body } });
  res.json({ clinic: updated });
});

router.post('/clinics/:id/invites', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const body = z.object({ email: z.string().trim().email().transform(normalizeEmail), role: z.enum(['doctor', 'clinic_admin']) }).parse(req.body);
  const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
  if (!clinic) throw notFound('Clinic not found');
  const existing = await findUserByEmail(body.email);
  if (existing && existing.role !== 'patient' && existing.role !== body.role) {
    throw conflict(`This email is registered as ${existing.role.replace('_', ' ')}`, 'ROLE_CONFLICT');
  }
  const result = await createInvite({ email: body.email, role: body.role, clinicId: id, clinicName: clinic.name, createdBy: authUser(req).id });
  await audit(req, { action: 'INVITE_SENT', targetType: 'invite', targetId: result.invite.id, clinicId: id, metadata: { email: body.email, role: body.role } });
  res.status(201).json({ inviteId: result.invite.id, inviteUrl: result.inviteUrl, emailSent: result.emailSent });
});

router.delete('/clinics/:clinicId/invites/:id', async (req, res) => {
  const clinicId = uuid.parse(req.params.clinicId);
  const id = uuid.parse(req.params.id);
  const revoked = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.id, id), eq(authTokens.clinicId, clinicId), eq(authTokens.purpose, 'invite'), isNull(authTokens.usedAt)))
    .returning({ id: authTokens.id });
  if (revoked.length === 0) throw notFound('Invite not found or already used');
  await audit(req, { action: 'INVITE_REVOKED', targetType: 'invite', targetId: id, clinicId });
  res.json({ ok: true });
});

// --- Users ---------------------------------------------------------------------------

router.get('/users', async (req, res) => {
  const q = z.object({ q: z.string().trim().max(100).optional(), role: z.enum(users.role.enumValues).optional() }).parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [];
  if (q.role) conds.push(eq(users.role, q.role));
  if (q.q) conds.push(or(sql`${users.name} ilike ${like(q.q)}`, sql`${users.email} ilike ${like(q.q)}`)!);
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      clinics: sql<string[]>`coalesce((select array_agg(c.name order by c.name) from clinic_members m join clinics c on c.id = m.clinic_id where m.user_id = "users"."id"), '{}')`,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
  const [total] = await db.select({ n: count() }).from(users).where(where);
  res.json(paged(rows, total?.n ?? 0, page, pageSize));
});

router.patch('/users/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  if (id === authUser(req).id) throw badRequest("You can't deactivate yourself", 'SELF_ACTION');
  const [updated] = await db
    .update(users)
    // Deactivation also revokes live sessions
    .set({ isActive, tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!updated) throw notFound('User not found');
  await audit(req, { action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', targetType: 'user', targetId: id });
  res.json({ user: publicUser(updated) });
});

// --- Audit log (read-only) -----------------------------------------------------------

router.get('/audit-logs', async (req, res) => {
  const q = z
    .object({
      action: z.string().trim().max(60).optional(),
      clinicId: uuid.optional(),
      actorId: uuid.optional(),
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
    })
    .parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [];
  if (q.action) conds.push(eq(auditLogs.action, q.action));
  if (q.clinicId) conds.push(eq(auditLogs.clinicId, q.clinicId));
  if (q.actorId) conds.push(eq(auditLogs.actorId, q.actorId));
  if (q.from) conds.push(gte(auditLogs.createdAt, new Date(q.from)));
  if (q.to) conds.push(lt(auditLogs.createdAt, new Date(q.to)));
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      actor: { id: users.id, name: users.name, email: users.email, role: users.role },
      clinic: { id: clinics.id, name: clinics.name },
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .leftJoin(clinics, eq(clinics.id, auditLogs.clinicId))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
  const [total] = await db.select({ n: count() }).from(auditLogs).where(where);
  const actions = await db.selectDistinct({ action: auditLogs.action }).from(auditLogs).orderBy(asc(auditLogs.action));
  res.json({ ...paged(rows, total?.n ?? 0, page, pageSize), actions: actions.map((a) => a.action) });
});

export default router;
