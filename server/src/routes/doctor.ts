import { Router, type Request } from 'express';
import { z } from 'zod';
import { and, asc, count, desc, eq, gte, inArray, lt, or, sql, type SQL } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '../db/db.js';
import { appointments, clinics, doctorAvailability, records, users } from '../db/schema.js';
import { authenticate, authorize, authUser } from '../middleware/auth.js';
import { forbidden, notFound, pageParams, paged } from '../lib/http.js';
import * as appts from '../services/appointments.js';
import { ACTIVE_STATUSES, replaceSchedule, scheduleSchema } from '../services/scheduling.js';
import { assertDoctorPatient, doctorRecordAccess, requireDoctorClinics } from '../services/access.js';
import {
  confirmUploadSchema,
  createRecordFromUpload,
  recordQuery,
  recordSelect,
  recordUploader,
  RECORD_TYPES,
} from '../services/records.js';
import { createUploadTicket } from '../services/storage.js';
import { notify } from '../services/notify.js';
import { publicUser } from '../services/users.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(authenticate, authorize('doctor'));

const uuid = z.string().uuid();
const actor = (req: Request) => ({ id: authUser(req).id, role: 'doctor' as const });
const clinicsOf = (req: Request) => requireDoctorClinics(authUser(req).id);

// --- Overview ----------------------------------------------------------------

router.get('/overview', async (req, res) => {
  const me = authUser(req);
  const clinicIds = await clinicsOf(req);
  const myClinics = await db.select({ id: clinics.id, name: clinics.name, timezone: clinics.timezone }).from(clinics).where(inArray(clinics.id, clinicIds));
  // "Today" follows the first clinic's timezone; doctors rarely span zones
  const zone = myClinics[0]?.timezone ?? 'UTC';
  const dayStart = DateTime.now().setZone(zone).startOf('day');
  const scope = and(eq(appointments.doctorId, me.id), inArray(appointments.clinicId, clinicIds));

  const today = await appts
    .listAppointments(
      and(scope, gte(appointments.startsAt, dayStart.toJSDate()), lt(appointments.startsAt, dayStart.plus({ days: 1 }).toJSDate()), sql`${appointments.status} <> 'cancelled'`)
    )
    .orderBy(asc(appointments.startsAt));
  const [stats] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${appointments.status} = 'pending' and ${appointments.startsAt} >= now())::int`,
      upcomingWeek: sql<number>`count(*) filter (where ${appointments.status} in ('pending','confirmed') and ${appointments.startsAt} >= now() and ${appointments.startsAt} < now() + interval '7 days')::int`,
      completedMonth: sql<number>`count(*) filter (where ${appointments.status} = 'completed' and ${appointments.completedAt} >= now() - interval '30 days')::int`,
      patients: sql<number>`count(distinct ${appointments.patientId})::int`,
    })
    .from(appointments)
    .where(scope);
  const needsAction = await appts
    .listAppointments(and(scope, eq(appointments.status, 'pending'), gte(appointments.startsAt, new Date())))
    .orderBy(asc(appointments.startsAt))
    .limit(10);

  res.json({ clinics: myClinics, timezone: zone, today: today.map(appts.shapeAppointment), needsAction: needsAction.map(appts.shapeAppointment), stats });
});

router.get('/clinics', async (req, res) => {
  const clinicIds = await clinicsOf(req);
  const rows = await db
    .select({ id: clinics.id, name: clinics.name, timezone: clinics.timezone, city: clinics.city, address: clinics.address, settings: clinics.settings })
    .from(clinics)
    .where(inArray(clinics.id, clinicIds))
    .orderBy(asc(clinics.name));
  res.json({ items: rows });
});

// --- Appointments ------------------------------------------------------------

const listQuery = z.object({
  scope: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
  status: z.enum(appointments.status.enumValues).optional(),
  clinicId: uuid.optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  q: z.string().trim().max(100).optional(),
});

router.get('/appointments', async (req, res) => {
  const me = authUser(req);
  const clinicIds = await clinicsOf(req);
  const q = listQuery.parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [eq(appointments.doctorId, me.id), inArray(appointments.clinicId, q.clinicId ? clinicIds.filter((c) => c === q.clinicId) : clinicIds)];
  const now = new Date();
  if (q.scope === 'upcoming') conds.push(gte(appointments.startsAt, now), inArray(appointments.status, [...ACTIVE_STATUSES]));
  if (q.scope === 'past') conds.push(or(lt(appointments.startsAt, now), inArray(appointments.status, ['completed', 'cancelled', 'no_show']))!);
  if (q.status) conds.push(eq(appointments.status, q.status));
  if (q.from) conds.push(gte(appointments.startsAt, new Date(q.from)));
  if (q.to) conds.push(lt(appointments.startsAt, new Date(q.to)));
  if (q.q) conds.push(sql`${appts.patientUser.name} ilike ${'%' + q.q + '%'}`);
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
  const clinicIds = await clinicsOf(req);
  const { appt } = await appts.loadForActor(id, actor(req), clinicIds);
  const appointment = await appts.getAppointmentDTO(id);
  const [p] = await db.select().from(users).where(eq(users.id, appt.patientId)).limit(1);
  const history = await appts
    .listAppointments(and(eq(appointments.patientId, appt.patientId), eq(appointments.doctorId, authUser(req).id)))
    .orderBy(desc(appointments.startsAt))
    .limit(10);
  res.json({
    appointment,
    patient: p ? clinicalPatient(p) : null,
    history: history.map(appts.shapeAppointment),
  });
});

const reasonBody = z.object({ reason: z.string().trim().max(500).optional() });

router.post('/appointments/:id/confirm', async (req, res) => {
  const id = uuid.parse(req.params.id);
  await appts.confirm(req, id, actor(req), await clinicsOf(req));
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/cancel', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { reason } = reasonBody.parse(req.body ?? {});
  await appts.cancel(req, id, actor(req), await clinicsOf(req), reason ?? null);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/complete', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { clinicalNotes } = z.object({ clinicalNotes: z.string().trim().max(10000).optional() }).parse(req.body ?? {});
  await appts.complete(req, id, actor(req), await clinicsOf(req), clinicalNotes);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/no-show', async (req, res) => {
  const id = uuid.parse(req.params.id);
  await appts.markNoShow(req, id, actor(req), await clinicsOf(req));
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.post('/appointments/:id/propose', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const body = z.object({ startsAt: z.string().datetime({ offset: true }), reason: z.string().trim().max(500).optional() }).parse(req.body);
  await appts.proposeReschedule(req, id, actor(req), await clinicsOf(req), body.startsAt, body.reason ?? null);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

router.put('/appointments/:id/notes', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { clinicalNotes } = z.object({ clinicalNotes: z.string().trim().max(10000) }).parse(req.body);
  await appts.setClinicalNotes(req, id, actor(req), await clinicsOf(req), clinicalNotes);
  res.json({ appointment: await appts.getAppointmentDTO(id) });
});

// --- Patients ----------------------------------------------------------------

function clinicalPatient(p: typeof users.$inferSelect) {
  const { phone, dateOfBirth, gender, bloodType, allergies, emergencyContact } = p.profile ?? {};
  return { id: p.id, name: p.name, email: p.email, avatarUrl: p.avatarUrl, phone, dateOfBirth, gender, bloodType, allergies, emergencyContact };
}

router.get('/patients', async (req, res) => {
  const me = authUser(req);
  const clinicIds = await clinicsOf(req);
  const q = z.object({ q: z.string().trim().max(100).optional() }).parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  // Only patients who have seen / booked this doctor
  const conds: SQL[] = [eq(appointments.doctorId, me.id), inArray(appointments.clinicId, clinicIds)];
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
  const me = authUser(req);
  const patientId = uuid.parse(req.params.id);
  const clinicIds = await clinicsOf(req);
  await assertDoctorPatient(me.id, patientId, clinicIds);
  const [p] = await db.select().from(users).where(eq(users.id, patientId)).limit(1);
  if (!p) throw notFound('Patient not found');
  const history = await appts
    .listAppointments(and(eq(appointments.patientId, patientId), eq(appointments.doctorId, me.id), inArray(appointments.clinicId, clinicIds)))
    .orderBy(desc(appointments.startsAt));
  const visibleRecords = await recordQuery()
    .where(and(eq(records.patientId, patientId), doctorRecordAccess(me.id, clinicIds)))
    .orderBy(desc(records.createdAt));
  await audit(req, { action: 'PATIENT_CHART_VIEWED', targetType: 'user', targetId: patientId });
  res.json({ patient: clinicalPatient(p), appointments: history.map(appts.shapeAppointment), records: visibleRecords });
});

// --- Records -----------------------------------------------------------------

router.get('/records', async (req, res) => {
  const me = authUser(req);
  const clinicIds = await clinicsOf(req);
  const q = z.object({ q: z.string().trim().max(100).optional(), type: z.enum(RECORD_TYPES).optional(), patientId: uuid.optional() }).parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [doctorRecordAccess(me.id, clinicIds)];
  if (q.type) conds.push(eq(records.recordType, q.type));
  if (q.patientId) conds.push(eq(records.patientId, q.patientId));
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

router.post('/records/upload-ticket', async (req, res) => {
  const me = authUser(req);
  const { patientId } = z.object({ patientId: uuid }).parse(req.body);
  await assertDoctorPatient(me.id, patientId, await clinicsOf(req));
  res.json(createUploadTicket(patientId));
});

router.post('/records', async (req, res) => {
  const me = authUser(req);
  const clinicIds = await clinicsOf(req);
  const body = confirmUploadSchema.extend({ patientId: uuid }).parse(req.body);
  await assertDoctorPatient(me.id, body.patientId, clinicIds);
  // Attach to the most recent shared clinic unless tied to a specific appointment
  const [latest] = await db
    .select({ clinicId: appointments.clinicId })
    .from(appointments)
    .where(and(eq(appointments.doctorId, me.id), eq(appointments.patientId, body.patientId), inArray(appointments.clinicId, clinicIds)))
    .orderBy(desc(appointments.startsAt))
    .limit(1);
  let clinicId = latest?.clinicId ?? null;
  if (body.appointmentId) {
    const [a] = await db.select().from(appointments).where(eq(appointments.id, body.appointmentId)).limit(1);
    if (!a || a.doctorId !== me.id || a.patientId !== body.patientId) throw forbidden('You can only attach records to your own appointments');
    clinicId = a.clinicId;
  }
  const record = await createRecordFromUpload(req, { ...body, uploadedBy: me.id, clinicId });
  await notify({
    userId: body.patientId,
    clinicId: record.clinicId,
    type: 'record_uploaded',
    title: 'New document added',
    message: `${/^dr\.?\s/i.test(me.name) ? me.name : `Dr. ${me.name || 'your doctor'}`} added "${record.title}" to your records.`,
    link: '/patient/records',
  });
  const [dto] = await recordQuery().where(eq(records.id, record.id));
  res.status(201).json({ record: dto });
});

// --- Availability ------------------------------------------------------------

router.get('/availability', async (req, res) => {
  const me = authUser(req);
  const clinicIds = await clinicsOf(req);
  const { clinicId } = z.object({ clinicId: uuid.optional() }).parse(req.query);
  const rows = await db
    .select()
    .from(doctorAvailability)
    .where(and(eq(doctorAvailability.doctorId, me.id), inArray(doctorAvailability.clinicId, clinicId ? clinicIds.filter((c) => c === clinicId) : clinicIds)))
    .orderBy(asc(doctorAvailability.dayOfWeek), asc(doctorAvailability.startTime));
  res.json({ items: rows });
});

router.put('/availability', async (req, res) => {
  const me = authUser(req);
  const body = scheduleSchema.parse(req.body);
  const clinicIds = await clinicsOf(req);
  if (!clinicIds.includes(body.clinicId)) throw forbidden('You are not an active member of this clinic');
  const items = await replaceSchedule(me.id, body.clinicId, body.schedule);
  await audit(req, { action: 'AVAILABILITY_UPDATED', targetType: 'user', targetId: me.id, clinicId: body.clinicId });
  res.json({ items });
});

// --- Profile -----------------------------------------------------------------

router.get('/profile', async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, authUser(req).id)).limit(1);
  if (!user) throw notFound();
  res.json({ user: publicUser(user) });
});

router.patch('/profile', async (req, res) => {
  const me = authUser(req);
  const body = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      profile: z
        .object({
          phone: z.string().trim().max(30).optional(),
          specialization: z.string().trim().max(100).optional(),
          licenseNumber: z.string().trim().max(60).optional(),
          bio: z.string().trim().max(2000).optional(),
          yearsOfExperience: z.number().int().min(0).max(70).nullable().optional(),
        })
        .strict()
        .optional(),
    })
    .parse(req.body);
  const [current] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!current) throw notFound();
  const [user] = await db
    .update(users)
    .set({ ...(body.name ? { name: body.name } : {}), profile: { ...current.profile, ...(body.profile ?? {}) }, updatedAt: new Date() })
    .where(eq(users.id, me.id))
    .returning();
  await audit(req, { action: 'PROFILE_UPDATED', targetType: 'user', targetId: me.id });
  res.json({ user: publicUser(user!) });
});

export default router;
