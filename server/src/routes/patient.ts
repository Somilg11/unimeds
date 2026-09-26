import { Router } from 'express';
import { z } from 'zod';
import { and, asc, count, desc, eq, gte, inArray, lt, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/db.js';
import { appointments, auditLogs, notifications, records, users } from '../db/schema.js';
import { authenticate, authorize, authUser } from '../middleware/auth.js';
import { badRequest, notFound, pageParams, paged } from '../lib/http.js';
import * as appts from '../services/appointments.js';
import { ACTIVE_STATUSES } from '../services/scheduling.js';
import { confirmUploadSchema, createRecordFromUpload, recordQuery, RECORD_TYPES } from '../services/records.js';
import { createUploadTicket, destroyAsset } from '../services/storage.js';
import { publicUser } from '../services/users.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(authenticate, authorize('patient'));

const actor = (req: Parameters<typeof authUser>[0]) => ({ id: authUser(req).id, role: 'patient' as const });
const uuid = z.string().uuid();

// --- Overview --------------------------------------------------------------

router.get('/overview', async (req, res) => {
  const me = authUser(req);
  const now = new Date();
  const upcoming = await appts
    .listAppointments(and(eq(appointments.patientId, me.id), inArray(appointments.status, [...ACTIVE_STATUSES]), gte(appointments.startsAt, now)))
    .orderBy(asc(appointments.startsAt))
    .limit(5);
  const [counts] = await db
    .select({
      upcoming: sql<number>`count(*) filter (where ${appointments.status} in ('pending','confirmed','reschedule_proposed') and ${appointments.startsAt} >= now())::int`,
      completed: sql<number>`count(*) filter (where ${appointments.status} = 'completed')::int`,
      actionRequired: sql<number>`count(*) filter (where ${appointments.status} = 'reschedule_proposed')::int`,
    })
    .from(appointments)
    .where(eq(appointments.patientId, me.id));
  const recentRecords = await recordQuery().where(eq(records.patientId, me.id)).orderBy(desc(records.createdAt)).limit(5);
  const [recordCount] = await db.select({ n: count() }).from(records).where(eq(records.patientId, me.id));
  res.json({
    upcoming: upcoming.map(appts.shapeAppointment),
    recentRecords,
    stats: { ...counts, records: recordCount?.n ?? 0 },
  });
});

// --- Appointments ----------------------------------------------------------

router.get('/appointments', async (req, res) => {
  const me = authUser(req);
  const q = z
    .object({ scope: z.enum(['upcoming', 'past', 'all']).default('all'), status: z.enum(appointments.status.enumValues).optional() })
    .parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [eq(appointments.patientId, me.id)];
  const now = new Date();
  if (q.scope === 'upcoming') conds.push(gte(appointments.startsAt, now), inArray(appointments.status, [...ACTIVE_STATUSES]));
  if (q.scope === 'past') conds.push(or(lt(appointments.startsAt, now), inArray(appointments.status, ['cancelled', 'completed', 'no_show']))!);
  if (q.status) conds.push(eq(appointments.status, q.status));
  const where = and(...conds);
  const rows = await appts
    .listAppointments(where)
    .orderBy(q.scope === 'upcoming' ? asc(appointments.startsAt) : desc(appointments.startsAt))
    .limit(limit)
    .offset(offset);
  const [total] = await db.select({ n: count() }).from(appointments).where(where);
  res.json(paged(rows.map(appts.shapeAppointment), total?.n ?? 0, page, pageSize));
});

router.get('/appointments/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  await appts.loadForActor(id, actor(req));
  const appointment = await appts.getAppointmentDTO(id);
  const attached = await recordQuery().where(and(eq(records.appointmentId, id), eq(records.patientId, authUser(req).id)));
  res.json({ appointment, records: attached });
});

router.post('/appointments', async (req, res) => {
  const body = z
    .object({
      doctorId: uuid,
      clinicId: uuid,
      startsAt: z.string().datetime({ offset: true }),
      reason: z.string().trim().max(1000).optional().nullable(),
    })
    .parse(req.body);
  const created = await appts.book(req, { ...body, patientId: authUser(req).id });
  res.status(201).json({ appointment: await appts.getAppointmentDTO(created.id) });
});

router.post('/appointments/:id/cancel', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { reason } = z.object({ reason: z.string().trim().max(500).optional() }).parse(req.body ?? {});
  await appts.cancel(req, id, actor(req), undefined, reason ?? null);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/reschedule', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { startsAt } = z.object({ startsAt: z.string().datetime({ offset: true }) }).parse(req.body);
  await appts.patientReschedule(req, id, actor(req), startsAt);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/respond', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { accept } = z.object({ accept: z.boolean() }).parse(req.body);
  await appts.respondToProposal(req, id, actor(req), accept);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

// --- Records ---------------------------------------------------------------

router.get('/records', async (req, res) => {
  const me = authUser(req);
  const q = z.object({ type: z.enum(RECORD_TYPES).optional(), q: z.string().trim().max(100).optional() }).parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [eq(records.patientId, me.id)];
  if (q.type) conds.push(eq(records.recordType, q.type));
  if (q.q) conds.push(or(sql`${records.title} ilike ${'%' + q.q + '%'}`, sql`${records.fileName} ilike ${'%' + q.q + '%'}`)!);
  const where = and(...conds);
  const rows = await recordQuery().where(where).orderBy(desc(records.createdAt)).limit(limit).offset(offset);
  const [total] = await db.select({ n: count() }).from(records).where(where);
  res.json(paged(rows, total?.n ?? 0, page, pageSize));
});

router.post('/records/upload-ticket', async (req, res) => {
  res.json(createUploadTicket(authUser(req).id));
});

router.post('/records', async (req, res) => {
  const me = authUser(req);
  const body = confirmUploadSchema.parse(req.body);
  const record = await createRecordFromUpload(req, { ...body, patientId: me.id, uploadedBy: me.id, clinicId: null });
  const [dto] = await recordQuery().where(eq(records.id, record.id));
  res.status(201).json({ record: dto });
});

router.patch('/records/:id', async (req, res) => {
  const me = authUser(req);
  const id = uuid.parse(req.params.id);
  const body = z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      recordType: z.enum(RECORD_TYPES).optional(),
      appointmentId: uuid.nullable().optional(),
    })
    .parse(req.body);
  const [record] = await db.select().from(records).where(and(eq(records.id, id), eq(records.patientId, me.id))).limit(1);
  if (!record) throw notFound('Record not found');
  const patch: Partial<typeof records.$inferInsert> = {};
  if (body.title) patch.title = body.title;
  if (body.recordType) patch.recordType = body.recordType;
  if (body.appointmentId !== undefined) {
    if (body.appointmentId) {
      const [appt] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, body.appointmentId), eq(appointments.patientId, me.id)))
        .limit(1);
      if (!appt) throw badRequest('Appointment not found');
      patch.appointmentId = appt.id;
      patch.clinicId = appt.clinicId;
    } else if (record.uploadedBy === me.id) {
      // Patients can un-share their own uploads; records created by a clinic stay with it
      patch.appointmentId = null;
      patch.clinicId = null;
    }
  }
  if (Object.keys(patch).length) await db.update(records).set(patch).where(eq(records.id, id));
  await audit(req, { action: 'RECORD_UPDATED', targetType: 'record', targetId: id, metadata: body });
  const [dto] = await recordQuery().where(eq(records.id, id));
  res.json({ record: dto });
});

router.delete('/records/:id', async (req, res) => {
  const me = authUser(req);
  const id = uuid.parse(req.params.id);
  const [record] = await db.select().from(records).where(and(eq(records.id, id), eq(records.patientId, me.id))).limit(1);
  if (!record) throw notFound('Record not found');
  // Remove the file first: if storage fails the record stays, so no orphaned PHI
  await destroyAsset(record.storagePublicId, record.storageResourceType);
  await db.delete(records).where(eq(records.id, id));
  await audit(req, { action: 'RECORD_DELETED', targetType: 'record', targetId: id, clinicId: record.clinicId });
  res.json({ ok: true });
});

// --- Profile / account -----------------------------------------------------

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  profile: z
    .object({
      phone: z.string().trim().max(30).optional(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).optional(),
      gender: z.enum(['female', 'male', 'non_binary', 'other', 'prefer_not_to_say', '']).optional(),
      bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).optional(),
      allergies: z.string().trim().max(1000).optional(),
      address: z.string().trim().max(300).optional(),
      emergencyContact: z
        .object({ name: z.string().trim().max(120).optional(), phone: z.string().trim().max(30).optional(), relation: z.string().trim().max(60).optional() })
        .optional(),
    })
    .strict()
    .optional(),
});

router.get('/profile', async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, authUser(req).id)).limit(1);
  if (!user) throw notFound();
  res.json({ user: publicUser(user) });
});

router.patch('/profile', async (req, res) => {
  const me = authUser(req);
  const body = profileSchema.parse(req.body);
  const [current] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!current) throw notFound();
  // Merge — never replace — the stored profile
  const [user] = await db
    .update(users)
    .set({
      ...(body.name ? { name: body.name } : {}),
      profile: { ...current.profile, ...(body.profile ?? {}) },
      updatedAt: new Date(),
    })
    .where(eq(users.id, me.id))
    .returning();
  await audit(req, { action: 'PROFILE_UPDATED', targetType: 'user', targetId: me.id });
  res.json({ user: publicUser(user!) });
});

// Data portability: everything we hold about the patient, as JSON
router.get('/export', async (req, res) => {
  const me = authUser(req);
  const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  const allAppointments = await appts.listAppointments(eq(appointments.patientId, me.id)).orderBy(desc(appointments.startsAt));
  const allRecords = await recordQuery().where(eq(records.patientId, me.id)).orderBy(desc(records.createdAt));
  const allNotifications = await db.select().from(notifications).where(eq(notifications.userId, me.id));
  await audit(req, { action: 'DATA_EXPORTED', targetType: 'user', targetId: me.id });
  res.setHeader('Content-Disposition', 'attachment; filename="unimeds-export.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    user: user ? publicUser(user) : null,
    appointments: allAppointments.map(appts.shapeAppointment),
    records: allRecords,
    notifications: allNotifications,
  });
});

router.delete('/account', async (req, res) => {
  const me = authUser(req);
  z.object({ confirm: z.literal('DELETE') }).parse(req.body);
  const upcoming = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.patientId, me.id), inArray(appointments.status, [...ACTIVE_STATUSES]), gte(appointments.startsAt, new Date())));
  if (upcoming.length) throw badRequest('Cancel your upcoming appointments before deleting your account', 'HAS_UPCOMING');

  const files = await db.select().from(records).where(eq(records.patientId, me.id));
  for (const f of files) await destroyAsset(f.storagePublicId, f.storageResourceType);
  await audit(req, { action: 'ACCOUNT_DELETED', targetType: 'user', targetId: me.id, metadata: { records: files.length } });
  // Keep the audit trail but detach it from the deleted identity
  await db.update(auditLogs).set({ actorId: null }).where(eq(auditLogs.actorId, me.id));
  await db.delete(users).where(eq(users.id, me.id));
  res.json({ ok: true });
});

export default router;
