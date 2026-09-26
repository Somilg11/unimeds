import { Router, type Request } from 'express';
import { z } from 'zod';
import { and, asc, count, desc, eq, gte, inArray, isNull, gt, lt, or, sql, type SQL } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '../db/db.js';
import { appointments, auditLogs, authTokens, clinicMembers, clinics, doctorAvailability, records, users } from '../db/schema.js';
import { authenticate, authorize, authUser, resolveAdminClinic, scopedClinicId } from '../middleware/auth.js';
import { badRequest, conflict, notFound, pageParams, paged } from '../lib/http.js';
import { normalizeEmail } from '../lib/tokens.js';
import * as appts from '../services/appointments.js';
import { ACTIVE_STATUSES, clinicSettings, replaceSchedule, scheduleSchema } from '../services/scheduling.js';
import { createInvite } from '../services/invites.js';
import { recordQuery, recordSelect, recordUploader, RECORD_TYPES } from '../services/records.js';
import { notify } from '../services/notify.js';
import { findUserByEmail } from '../services/users.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(authenticate, authorize('clinic_admin'), resolveAdminClinic);

const uuid = z.string().uuid();
const actor = (req: Request) => ({ id: authUser(req).id, role: 'clinic_admin' as const });

async function loadClinic(req: Request) {
  const [clinic] = await db.select().from(clinics).where(eq(clinics.id, scopedClinicId(req))).limit(1);
  if (!clinic) throw notFound('Clinic not found');
  return clinic;
}

// --- Clinic profile & settings -----------------------------------------------

router.get('/', async (req, res) => {
  const clinic = await loadClinic(req);
  res.json({ clinic: { ...clinic, settings: clinicSettings(clinic) } });
});

const validTimezone = z.string().refine((tz) => DateTime.local().setZone(tz).isValid, 'Unknown timezone');

router.patch('/', async (req, res) => {
  const clinic = await loadClinic(req);
  const body = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().max(30).nullable().optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      logoUrl: z.string().url().max(1000).nullable().optional(),
      address: z.string().trim().max(300).nullable().optional(),
      city: z.string().trim().max(100).nullable().optional(),
      state: z.string().trim().max(100).nullable().optional(),
      zipCode: z.string().trim().max(20).nullable().optional(),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      timezone: validTimezone.optional(),
      settings: z
        .object({
          slotDurationMinutes: z.number().int().refine((n) => [10, 15, 20, 30, 45, 60].includes(n), 'Unsupported slot length').optional(),
          bookingWindowDays: z.number().int().min(1).max(180).optional(),
          cancellationHours: z.number().int().min(0).max(168).optional(),
          autoConfirm: z.boolean().optional(),
        })
        .strict()
        .optional(),
    })
    .strict()
    .parse(req.body);
  const { settings, ...fields } = body;
  const [updated] = await db
    .update(clinics)
    .set({ ...fields, ...(settings ? { settings: { ...clinicSettings(clinic), ...settings } } : {}), updatedAt: new Date() })
    .where(eq(clinics.id, clinic.id))
    .returning();
  await audit(req, { action: 'CLINIC_SETTINGS_UPDATED', targetType: 'clinic', targetId: clinic.id, clinicId: clinic.id, metadata: { changes: body } });
  res.json({ clinic: { ...updated!, settings: clinicSettings(updated!) } });
});

// --- Overview & analytics -------------------------------------------------------

router.get('/overview', async (req, res) => {
  const clinic = await loadClinic(req);
  const dayStart = DateTime.now().setZone(clinic.timezone).startOf('day');
  const scope = eq(appointments.clinicId, clinic.id);
  const today = await appts
    .listAppointments(and(scope, gte(appointments.startsAt, dayStart.toJSDate()), lt(appointments.startsAt, dayStart.plus({ days: 1 }).toJSDate())))
    .orderBy(asc(appointments.startsAt));
  const pending = await appts
    .listAppointments(and(scope, eq(appointments.status, 'pending'), gte(appointments.startsAt, new Date())))
    .orderBy(asc(appointments.startsAt))
    .limit(10);
  const [stats] = await db
    .select({
      next7Days: sql<number>`count(*) filter (where ${appointments.status} in ('pending','confirmed') and ${appointments.startsAt} >= now() and ${appointments.startsAt} < now() + interval '7 days')::int`,
      pending: sql<number>`count(*) filter (where ${appointments.status} = 'pending' and ${appointments.startsAt} >= now())::int`,
      patients: sql<number>`count(distinct ${appointments.patientId})::int`,
      completed30d: sql<number>`count(*) filter (where ${appointments.status} = 'completed' and ${appointments.startsAt} >= now() - interval '30 days')::int`,
    })
    .from(appointments)
    .where(scope);
  const [doctors] = await db
    .select({ n: count() })
    .from(clinicMembers)
    .where(and(eq(clinicMembers.clinicId, clinic.id), eq(clinicMembers.role, 'doctor'), eq(clinicMembers.isActive, true)));
  res.json({
    clinic: { id: clinic.id, name: clinic.name, timezone: clinic.timezone, status: clinic.status },
    today: today.map(appts.shapeAppointment),
    pending: pending.map(appts.shapeAppointment),
    stats: { ...stats, doctors: doctors?.n ?? 0 },
  });
});

router.get('/analytics', async (req, res) => {
  const clinic = await loadClinic(req);
  const { months } = z.object({ months: z.coerce.number().int().min(1).max(24).default(6) }).parse(req.query);
  const since = DateTime.now().setZone(clinic.timezone).startOf('month').minus({ months: months - 1 });
  const scope = and(eq(appointments.clinicId, clinic.id), gte(appointments.startsAt, since.toJSDate()));
  const monthExpr = sql<string>`to_char(date_trunc('month', ${appointments.startsAt} at time zone ${clinic.timezone}), 'YYYY-MM')`;

  const trendRows = await db
    .select({
      month: monthExpr,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${appointments.status} = 'completed')::int`,
      cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')::int`,
      noShow: sql<number>`count(*) filter (where ${appointments.status} = 'no_show')::int`,
    })
    .from(appointments)
    .where(scope)
    // Ordinal grouping: the timezone is a bound parameter, so repeating the expression wouldn't match
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  // Fill empty months so charts have a continuous axis
  const trend = Array.from({ length: months }, (_, i) => {
    const key = since.plus({ months: i }).toFormat('yyyy-LL');
    return trendRows.find((r) => r.month === key) ?? { month: key, total: 0, completed: 0, cancelled: 0, noShow: 0 };
  });

  const statusBreakdown = await db
    .select({ status: appointments.status, count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(scope)
    .groupBy(appointments.status);

  const doctorPerformance = await db
    .select({
      doctorId: users.id,
      name: users.name,
      specialization: sql<string | null>`${users.profile}->>'specialization'`,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${appointments.status} = 'completed')::int`,
      cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')::int`,
      noShow: sql<number>`count(*) filter (where ${appointments.status} = 'no_show')::int`,
      patients: sql<number>`count(distinct ${appointments.patientId})::int`,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.doctorId))
    .where(scope)
    .groupBy(users.id)
    .orderBy(desc(sql`count(*)`));

  // Rates only consider visits whose time has passed
  const [past] = await db
    .select({
      finished: sql<number>`count(*) filter (where ${appointments.status} in ('completed','no_show'))::int`,
      noShow: sql<number>`count(*) filter (where ${appointments.status} = 'no_show')::int`,
      total: sql<number>`count(*)::int`,
      cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')::int`,
      newPatients: sql<number>`count(distinct ${appointments.patientId}) filter (where not exists (
        select 1 from appointments a2 where a2.patient_id = "appointments"."patient_id" and a2.clinic_id = ${clinic.id} and a2.starts_at < ${since.toJSDate()}))::int`,
    })
    .from(appointments)
    .where(and(scope, lt(appointments.startsAt, new Date())));

  const pct = (n = 0, d = 0) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
  res.json({
    range: { months, since: since.toISODate() },
    kpis: {
      totalAppointments: past?.total ?? 0,
      noShowRate: pct(past?.noShow, past?.finished),
      cancellationRate: pct(past?.cancelled, past?.total),
      newPatients: past?.newPatients ?? 0,
    },
    trend,
    statusBreakdown,
    doctorPerformance,
  });
});

// --- Appointments ----------------------------------------------------------------

router.get('/appointments', async (req, res) => {
  const clinicId = scopedClinicId(req);
  const q = z
    .object({
      scope: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
      status: z.enum(appointments.status.enumValues).optional(),
      doctorId: uuid.optional(),
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
      q: z.string().trim().max(100).optional(),
    })
    .parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [eq(appointments.clinicId, clinicId)];
  const now = new Date();
  if (q.scope === 'upcoming') conds.push(gte(appointments.startsAt, now), inArray(appointments.status, [...ACTIVE_STATUSES]));
  if (q.scope === 'past') conds.push(or(lt(appointments.startsAt, now), inArray(appointments.status, ['completed', 'cancelled', 'no_show']))!);
  if (q.status) conds.push(eq(appointments.status, q.status));
  if (q.doctorId) conds.push(eq(appointments.doctorId, q.doctorId));
  if (q.from) conds.push(gte(appointments.startsAt, new Date(q.from)));
  if (q.to) conds.push(lt(appointments.startsAt, new Date(q.to)));
  if (q.q) conds.push(or(sql`${appts.patientUser.name} ilike ${'%' + q.q + '%'}`, sql`${appts.patientUser.email} ilike ${'%' + q.q + '%'}`)!);
  const where = and(...conds);
  const rows = await appts
    .listAppointments(where)
    .orderBy(q.scope === 'past' ? desc(appointments.startsAt) : asc(appointments.startsAt))
    .limit(limit)
    .offset(offset);
  const [total] = await db
    .select({ n: count() })
    .from(appointments)
    .innerJoin(appts.patientUser, eq(appts.patientUser.id, appointments.patientId))
    .where(where);
  res.json(paged(rows.map(appts.shapeAppointment), total?.n ?? 0, page, pageSize));
});

router.get('/appointments/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  await appts.loadForActor(id, actor(req), scopedClinicId(req));
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

// Front-desk booking (phone / walk-in). Creates a patient account if needed.
router.post('/appointments', async (req, res) => {
  const clinicId = scopedClinicId(req);
  const body = z
    .object({
      doctorId: uuid,
      startsAt: z.string().datetime({ offset: true }),
      reason: z.string().trim().max(1000).optional().nullable(),
      patient: z.object({ email: z.string().trim().email().transform(normalizeEmail), name: z.string().trim().min(2).max(120), phone: z.string().trim().max(30).optional() }),
    })
    .parse(req.body);

  let patient = await findUserByEmail(body.patient.email);
  if (patient && patient.role !== 'patient') throw conflict('This email belongs to a staff account', 'NOT_A_PATIENT');
  if (!patient) {
    [patient] = await db
      .insert(users)
      .values({ email: body.patient.email, name: body.patient.name, role: 'patient', profile: body.patient.phone ? { phone: body.patient.phone } : {} })
      .returning();
    await audit(req, { action: 'PATIENT_CREATED_BY_CLINIC', targetType: 'user', targetId: patient!.id, clinicId });
  }
  const created = await appts.book(req, {
    patientId: patient!.id,
    doctorId: body.doctorId,
    clinicId,
    startsAt: body.startsAt,
    reason: body.reason ?? null,
    bookedByStaff: true,
  });
  res.status(201).json({ appointment: await appts.getAppointmentDTO(created.id) });
});

const reasonBody = z.object({ reason: z.string().trim().max(500).optional() });

router.post('/appointments/:id/confirm', async (req, res) => {
  const id = uuid.parse(req.params.id);
  await appts.confirm(req, id, actor(req), scopedClinicId(req));
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/cancel', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { reason } = reasonBody.parse(req.body ?? {});
  await appts.cancel(req, id, actor(req), scopedClinicId(req), reason ?? null);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/no-show', async (req, res) => {
  const id = uuid.parse(req.params.id);
  await appts.markNoShow(req, id, actor(req), scopedClinicId(req));
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/propose', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const body = z.object({ startsAt: z.string().datetime({ offset: true }), reason: z.string().trim().max(500).optional() }).parse(req.body);
  await appts.proposeReschedule(req, id, actor(req), scopedClinicId(req), body.startsAt, body.reason ?? null);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

// --- Team (members + invites) ---------------------------------------------------

router.get('/team', async (req, res) => {
  const clinicId = scopedClinicId(req);
  const members = await db
    .select({
      id: clinicMembers.id,
      role: clinicMembers.role,
      isActive: clinicMembers.isActive,
      joinedAt: clinicMembers.joinedAt,
      user: { id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl, profile: users.profile },
      upcoming: sql<number>`(select count(*)::int from appointments a where a.doctor_id = "users"."id" and a.clinic_id = ${clinicId}
        and a.status in ('pending','confirmed','reschedule_proposed') and a.starts_at >= now())`,
    })
    .from(clinicMembers)
    .innerJoin(users, eq(users.id, clinicMembers.userId))
    .where(eq(clinicMembers.clinicId, clinicId))
    .orderBy(asc(clinicMembers.role), asc(users.name));
  const invites = await db
    .select({ id: authTokens.id, email: authTokens.email, role: authTokens.role, expiresAt: authTokens.expiresAt, createdAt: authTokens.createdAt })
    .from(authTokens)
    .where(and(eq(authTokens.clinicId, clinicId), eq(authTokens.purpose, 'invite'), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .orderBy(desc(authTokens.createdAt));
  res.json({
    members: members.map((m) => ({
      ...m,
      user: { ...m.user, profile: undefined, specialization: m.user.profile?.specialization ?? null, phone: m.user.profile?.phone ?? null },
    })),
    invites,
  });
});

router.post('/team/invites', async (req, res) => {
  const clinic = await loadClinic(req);
  const body = z
    .object({ email: z.string().trim().email().transform(normalizeEmail), role: z.enum(['doctor', 'clinic_admin']) })
    .parse(req.body);
  const existing = await findUserByEmail(body.email);
  if (existing) {
    const [member] = await db
      .select()
      .from(clinicMembers)
      .where(and(eq(clinicMembers.clinicId, clinic.id), eq(clinicMembers.userId, existing.id), eq(clinicMembers.role, body.role)))
      .limit(1);
    if (member?.isActive) throw conflict('This person is already on your team', 'ALREADY_MEMBER');
    if (existing.role !== 'patient' && existing.role !== body.role) {
      throw conflict(`This email is registered as ${existing.role.replace('_', ' ')} and can't be invited as ${body.role.replace('_', ' ')}`, 'ROLE_CONFLICT');
    }
  }
  const result = await createInvite({ email: body.email, role: body.role, clinicId: clinic.id, clinicName: clinic.name, createdBy: authUser(req).id });
  await audit(req, { action: 'INVITE_SENT', targetType: 'invite', targetId: result.invite.id, clinicId: clinic.id, metadata: { email: body.email, role: body.role } });
  res.status(201).json({ inviteId: result.invite.id, inviteUrl: result.inviteUrl, emailSent: result.emailSent });
});

router.post('/team/invites/:id/resend', async (req, res) => {
  const clinic = await loadClinic(req);
  const id = uuid.parse(req.params.id);
  const [invite] = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.id, id), eq(authTokens.clinicId, clinic.id), eq(authTokens.purpose, 'invite')))
    .limit(1);
  if (!invite || !invite.role || invite.role === 'patient' || invite.role === 'super_admin') throw notFound('Invite not found');
  const result = await createInvite({ email: invite.email, role: invite.role, clinicId: clinic.id, clinicName: clinic.name, createdBy: authUser(req).id });
  res.json({ inviteId: result.invite.id, inviteUrl: result.inviteUrl, emailSent: result.emailSent });
});

router.delete('/team/invites/:id', async (req, res) => {
  const clinicId = scopedClinicId(req);
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

async function loadMember(req: Request) {
  const clinicId = scopedClinicId(req);
  const id = uuid.parse(req.params.id);
  const [member] = await db.select().from(clinicMembers).where(and(eq(clinicMembers.id, id), eq(clinicMembers.clinicId, clinicId))).limit(1);
  if (!member) throw notFound('Team member not found');
  return member;
}

async function upcomingFor(doctorId: string, clinicId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.clinicId, clinicId),
        inArray(appointments.status, [...ACTIVE_STATUSES]),
        gte(appointments.startsAt, new Date())
      )
    );
  return row?.n ?? 0;
}

router.patch('/team/:id', async (req, res) => {
  const member = await loadMember(req);
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  if (member.userId === authUser(req).id) throw badRequest("You can't change your own access");
  if (!isActive && member.role === 'doctor') {
    const n = await upcomingFor(member.userId, member.clinicId);
    if (n > 0) throw conflict(`This doctor has ${n} upcoming appointment(s). Cancel or reassign them first.`, 'HAS_UPCOMING');
  }
  await db.update(clinicMembers).set({ isActive }).where(eq(clinicMembers.id, member.id));
  await notify({
    userId: member.userId,
    clinicId: member.clinicId,
    type: 'membership',
    title: isActive ? 'Access restored' : 'Access paused',
    message: isActive ? 'Your access to the clinic has been restored.' : 'Your access to the clinic has been paused by an administrator.',
  });
  await audit(req, { action: isActive ? 'MEMBER_ACTIVATED' : 'MEMBER_DEACTIVATED', targetType: 'member', targetId: member.id, clinicId: member.clinicId });
  res.json({ ok: true });
});

router.delete('/team/:id', async (req, res) => {
  const member = await loadMember(req);
  if (member.userId === authUser(req).id) throw badRequest("You can't remove yourself");
  if (member.role === 'doctor') {
    const n = await upcomingFor(member.userId, member.clinicId);
    if (n > 0) throw conflict(`This doctor has ${n} upcoming appointment(s). Cancel or reassign them first.`, 'HAS_UPCOMING');
    await db.delete(doctorAvailability).where(and(eq(doctorAvailability.doctorId, member.userId), eq(doctorAvailability.clinicId, member.clinicId)));
  }
  await db.delete(clinicMembers).where(eq(clinicMembers.id, member.id));
  await audit(req, { action: 'MEMBER_REMOVED', targetType: 'member', targetId: member.id, clinicId: member.clinicId, metadata: { userId: member.userId, role: member.role } });
  res.json({ ok: true });
});

// Clinic admins can manage their doctors' schedules
router.get('/team/:id/availability', async (req, res) => {
  const member = await loadMember(req);
  const items = await db
    .select()
    .from(doctorAvailability)
    .where(and(eq(doctorAvailability.doctorId, member.userId), eq(doctorAvailability.clinicId, member.clinicId)))
    .orderBy(asc(doctorAvailability.dayOfWeek), asc(doctorAvailability.startTime));
  res.json({ items });
});

router.put('/team/:id/availability', async (req, res) => {
  const member = await loadMember(req);
  if (member.role !== 'doctor') throw badRequest('Only doctors have availability');
  const { schedule } = scheduleSchema.omit({ clinicId: true }).parse(req.body);
  const items = await replaceSchedule(member.userId, member.clinicId, schedule);
  await audit(req, { action: 'AVAILABILITY_UPDATED', targetType: 'user', targetId: member.userId, clinicId: member.clinicId });
  res.json({ items });
});

// --- Patients & records -----------------------------------------------------------

router.get('/patients', async (req, res) => {
  const clinicId = scopedClinicId(req);
  const q = z.object({ q: z.string().trim().max(100).optional() }).parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [eq(appointments.clinicId, clinicId)];
  if (q.q) conds.push(or(sql`${users.name} ilike ${'%' + q.q + '%'}`, sql`${users.email} ilike ${'%' + q.q + '%'}`, sql`${users.profile}->>'phone' ilike ${'%' + q.q + '%'}`)!);
  const where = and(...conds);
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      phone: sql<string | null>`${users.profile}->>'phone'`,
      visits: sql<number>`count(*) filter (where ${appointments.status} = 'completed')::int`,
      lastVisit: sql<Date | null>`max(${appointments.startsAt}) filter (where ${appointments.status} = 'completed')`,
      nextVisit: sql<Date | null>`min(${appointments.startsAt}) filter (where ${appointments.startsAt} >= now() and ${appointments.status} in ('pending','confirmed','reschedule_proposed'))`,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.patientId))
    .where(where)
    .groupBy(users.id)
    .orderBy(sql`max(${appointments.startsAt}) desc`)
    .limit(limit)
    .offset(offset);
  const [total] = await db
    .select({ n: sql<number>`count(distinct ${appointments.patientId})::int` })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.patientId))
    .where(where);
  res.json(paged(rows, total?.n ?? 0, page, pageSize));
});

router.get('/patients/:id', async (req, res) => {
  const clinicId = scopedClinicId(req);
  const patientId = uuid.parse(req.params.id);
  const history = await appts
    .listAppointments(and(eq(appointments.patientId, patientId), eq(appointments.clinicId, clinicId)))
    .orderBy(desc(appointments.startsAt));
  if (history.length === 0) throw notFound('Patient not found at this clinic');
  const [p] = await db.select().from(users).where(eq(users.id, patientId)).limit(1);
  const clinicRecords = await recordQuery()
    .where(and(eq(records.patientId, patientId), eq(records.clinicId, clinicId)))
    .orderBy(desc(records.createdAt));
  res.json({
    patient: p ? { id: p.id, name: p.name, email: p.email, avatarUrl: p.avatarUrl, phone: p.profile?.phone ?? null, dateOfBirth: p.profile?.dateOfBirth ?? null, gender: p.profile?.gender ?? null } : null,
    appointments: history.map(appts.shapeAppointment),
    records: clinicRecords,
  });
});

router.get('/records', async (req, res) => {
  const clinicId = scopedClinicId(req);
  const q = z.object({ q: z.string().trim().max(100).optional(), type: z.enum(RECORD_TYPES).optional() }).parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  // Only documents shared with / created at this clinic — never a patient's private uploads
  const conds: SQL[] = [eq(records.clinicId, clinicId)];
  if (q.type) conds.push(eq(records.recordType, q.type));
  if (q.q) conds.push(sql`${records.title} ilike ${'%' + q.q + '%'}`);
  const where = and(...conds);
  const rows = await db
    .select({ ...recordSelect, patient: { id: users.id, name: users.name } })
    .from(records)
    .innerJoin(users, eq(users.id, records.patientId))
    .leftJoin(recordUploader, eq(recordUploader.id, records.uploadedBy))
    .leftJoin(clinics, eq(clinics.id, records.clinicId))
    .where(where)
    .orderBy(desc(records.createdAt))
    .limit(limit)
    .offset(offset);
  const [total] = await db.select({ n: count() }).from(records).where(where);
  res.json(paged(rows, total?.n ?? 0, page, pageSize));
});

router.get('/audit-logs', async (req, res) => {
  const clinicId = scopedClinicId(req);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const where = eq(auditLogs.clinicId, clinicId);
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      createdAt: auditLogs.createdAt,
      actor: { id: users.id, name: users.name, role: users.role },
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
  const [total] = await db.select({ n: count() }).from(auditLogs).where(where);
  res.json(paged(rows, total?.n ?? 0, page, pageSize));
});

export default router;
