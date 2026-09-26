import { Router } from 'express';
import { z } from 'zod';
import { and, asc, count, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/db.js';
import { clinicMembers, clinics, users } from '../db/schema.js';
import { notFound, pageParams, paged } from '../lib/http.js';
import { getFreeSlots, loadBookableContext, clinicSettings } from '../services/scheduling.js';

const router = Router();

const publicClinic = {
  id: clinics.id,
  name: clinics.name,
  slug: clinics.slug,
  description: clinics.description,
  logoUrl: clinics.logoUrl,
  phone: clinics.phone,
  address: clinics.address,
  city: clinics.city,
  state: clinics.state,
  zipCode: clinics.zipCode,
  latitude: clinics.latitude,
  longitude: clinics.longitude,
  timezone: clinics.timezone,
};

const geoQuery = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  specialization: z.string().trim().max(100).optional(),
  clinicId: z.string().uuid().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(500).default(25),
});

function distanceExpr(lat: number, lng: number) {
  // Haversine, clamped to avoid acos domain errors from float rounding
  return sql<number>`(6371 * acos(least(1, greatest(-1,
    cos(radians(${lat})) * cos(radians(${clinics.latitude})) * cos(radians(${clinics.longitude}) - radians(${lng}))
    + sin(radians(${lat})) * sin(radians(${clinics.latitude}))))))`;
}

const like = (v: string) => `%${v.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

router.get('/clinics', async (req, res) => {
  const q = geoQuery.parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [eq(clinics.status, 'active')];
  if (q.q) conds.push(or(sql`${clinics.name} ilike ${like(q.q)}`, sql`${clinics.address} ilike ${like(q.q)}`, sql`${clinics.city} ilike ${like(q.q)}`)!);
  if (q.city) conds.push(sql`${clinics.city} ilike ${q.city}`);

  const hasGeo = q.lat !== undefined && q.lng !== undefined;
  const dist = hasGeo ? distanceExpr(q.lat!, q.lng!) : null;
  if (dist) conds.push(sql`${clinics.latitude} is not null and ${clinics.longitude} is not null and ${dist} <= ${q.radiusKm}`);

  const where = and(...conds);
  const doctorCount = sql<number>`(select count(*)::int from ${clinicMembers} m where m.clinic_id = "clinics"."id" and m.role = 'doctor' and m.is_active)`;
  const rows = await db
    .select({ ...publicClinic, doctorCount, distanceKm: dist ?? sql<null>`null` })
    .from(clinics)
    .where(where)
    .orderBy(dist ? asc(dist) : asc(clinics.name))
    .limit(limit)
    .offset(offset);
  const [total] = await db.select({ n: count() }).from(clinics).where(where);
  res.json(paged(rows, total?.n ?? 0, page, pageSize));
});

router.get('/clinics/:idOrSlug', async (req, res) => {
  const key = String(req.params.idOrSlug);
  const isUuid = z.string().uuid().safeParse(key).success;
  const [clinic] = await db
    .select({ ...publicClinic, settings: clinics.settings })
    .from(clinics)
    .where(and(eq(clinics.status, 'active'), isUuid ? eq(clinics.id, key) : eq(clinics.slug, key)))
    .limit(1);
  if (!clinic) throw notFound('Clinic not found');
  const doctors = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, profile: users.profile })
    .from(clinicMembers)
    .innerJoin(users, eq(users.id, clinicMembers.userId))
    .where(and(eq(clinicMembers.clinicId, clinic.id), eq(clinicMembers.role, 'doctor'), eq(clinicMembers.isActive, true), eq(users.isActive, true)))
    .orderBy(asc(users.name));
  const { settings, ...rest } = clinic;
  const s = clinicSettings({ settings });
  res.json({
    clinic: { ...rest, bookingWindowDays: s.bookingWindowDays, slotDurationMinutes: s.slotDurationMinutes, cancellationHours: s.cancellationHours },
    doctors: doctors.map((d) => ({ id: d.id, name: d.name, avatarUrl: d.avatarUrl, ...publicDoctorProfile(d.profile) })),
  });
});

function publicDoctorProfile(profile: Record<string, unknown> | null) {
  const p = (profile ?? {}) as { specialization?: string; bio?: string; yearsOfExperience?: number };
  return { specialization: p.specialization ?? null, bio: p.bio ?? null, yearsOfExperience: p.yearsOfExperience ?? null };
}

router.get('/doctors', async (req, res) => {
  const q = geoQuery.parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const conds: SQL[] = [
    eq(users.role, 'doctor'),
    eq(users.isActive, true),
    eq(clinicMembers.role, 'doctor'),
    eq(clinicMembers.isActive, true),
    eq(clinics.status, 'active'),
  ];
  if (q.q) conds.push(or(sql`${users.name} ilike ${like(q.q)}`, sql`${users.profile}->>'specialization' ilike ${like(q.q)}`)!);
  if (q.specialization) conds.push(sql`${users.profile}->>'specialization' ilike ${q.specialization}`);
  if (q.clinicId) conds.push(eq(clinics.id, q.clinicId));
  if (q.city) conds.push(sql`${clinics.city} ilike ${q.city}`);
  const hasGeo = q.lat !== undefined && q.lng !== undefined;
  const dist = hasGeo ? distanceExpr(q.lat!, q.lng!) : null;
  if (dist) conds.push(sql`${clinics.latitude} is not null and ${dist} <= ${q.radiusKm}`);
  const where = and(...conds);

  // Page over distinct doctors, then attach every clinic they practise at
  const idRows = await db
    .selectDistinctOn([users.name, users.id], { id: users.id, name: users.name })
    .from(users)
    .innerJoin(clinicMembers, eq(clinicMembers.userId, users.id))
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(where)
    .orderBy(asc(users.name), asc(users.id))
    .limit(limit)
    .offset(offset);
  const [total] = await db
    .select({ n: sql<number>`count(distinct ${users.id})::int` })
    .from(users)
    .innerJoin(clinicMembers, eq(clinicMembers.userId, users.id))
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(where);

  const ids = idRows.map((r) => r.id);
  const rows = ids.length
    ? await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          profile: users.profile,
          clinic: { id: clinics.id, name: clinics.name, city: clinics.city, address: clinics.address, timezone: clinics.timezone },
          distanceKm: dist ?? sql<null>`null`,
        })
        .from(users)
        .innerJoin(clinicMembers, eq(clinicMembers.userId, users.id))
        .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
        .where(and(where, inArray(users.id, ids)))
    : [];

  const byId = new Map<string, { id: string; name: string; avatarUrl: string | null; specialization: string | null; bio: string | null; yearsOfExperience: number | null; clinics: Array<(typeof rows)[number]['clinic'] & { distanceKm: number | null }> }>();
  for (const r of rows) {
    const entry = byId.get(r.id) ?? { id: r.id, name: r.name, avatarUrl: r.avatarUrl, ...publicDoctorProfile(r.profile), clinics: [] };
    entry.clinics.push({ ...r.clinic, distanceKm: r.distanceKm });
    byId.set(r.id, entry);
  }
  const items = ids.map((id) => byId.get(id)!).filter(Boolean);
  res.json(paged(items, total?.n ?? 0, page, pageSize));
});

router.get('/doctors/:id', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      profile: users.profile,
      clinic: publicClinic,
    })
    .from(users)
    .innerJoin(clinicMembers, eq(clinicMembers.userId, users.id))
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(
      and(
        eq(users.id, id),
        eq(users.role, 'doctor'),
        eq(users.isActive, true),
        eq(clinicMembers.role, 'doctor'),
        eq(clinicMembers.isActive, true),
        eq(clinics.status, 'active')
      )
    );
  const first = rows[0];
  if (!first) throw notFound('Doctor not found');
  res.json({
    doctor: { id: first.id, name: first.name, avatarUrl: first.avatarUrl, ...publicDoctorProfile(first.profile), clinics: rows.map((r) => r.clinic) },
  });
});

router.get('/specializations', async (_req, res) => {
  const rows = await db
    .select({ name: sql<string>`${users.profile}->>'specialization'`, doctors: count() })
    .from(users)
    .where(and(eq(users.role, 'doctor'), eq(users.isActive, true), sql`coalesce(${users.profile}->>'specialization', '') <> ''`))
    .groupBy(sql`${users.profile}->>'specialization'`)
    .orderBy(asc(sql`${users.profile}->>'specialization'`));
  res.json({ items: rows });
});

router.get('/slots', async (req, res) => {
  const q = z
    .object({ doctorId: z.string().uuid(), clinicId: z.string().uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
    .parse(req.query);
  const clinic = await loadBookableContext(q.doctorId, q.clinicId);
  const slots = await getFreeSlots(q.doctorId, clinic, q.date);
  res.json({ timezone: clinic.timezone, date: q.date, slots });
});

router.get('/stats', async (_req, res) => {
  const [c] = await db.select({ n: count() }).from(clinics).where(eq(clinics.status, 'active'));
  const [d] = await db
    .select({ n: sql<number>`count(distinct ${clinicMembers.userId})::int` })
    .from(clinicMembers)
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(and(eq(clinicMembers.role, 'doctor'), eq(clinicMembers.isActive, true), eq(clinics.status, 'active')));
  const [cities] = await db
    .select({ n: sql<number>`count(distinct lower(${clinics.city}))::int` })
    .from(clinics)
    .where(eq(clinics.status, 'active'));
  res.json({ clinics: c?.n ?? 0, doctors: d?.n ?? 0, cities: cities?.n ?? 0 });
});

export default router;
