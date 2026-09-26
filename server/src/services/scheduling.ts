import { DateTime } from 'luxon';
import { z } from 'zod';
import { and, asc, eq, gte, inArray, lt } from 'drizzle-orm';
import { db, type DbOrTx } from '../db/db.js';
import {
  appointments,
  clinicMembers,
  clinics,
  doctorAvailability,
  DEFAULT_CLINIC_SETTINGS,
  type Clinic,
  type ClinicSettings,
} from '../db/schema.js';
import { badRequest, notFound } from '../lib/http.js';

export const ACTIVE_STATUSES = ['pending', 'confirmed', 'reschedule_proposed'] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isHHMM = (v: string) => TIME_RE.test(v);
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const clinicSettings = (clinic: Pick<Clinic, 'settings'>): ClinicSettings => ({
  ...DEFAULT_CLINIC_SETTINGS,
  ...(clinic.settings ?? {}),
});

export type Slot = { startsAt: string; endsAt: string; label: string };

/** Loads a clinic and verifies the doctor actively practises there. */
export async function loadBookableContext(doctorId: string, clinicId: string, conn: DbOrTx = db) {
  const [row] = await conn
    .select({ clinic: clinics })
    .from(clinicMembers)
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(
      and(
        eq(clinicMembers.clinicId, clinicId),
        eq(clinicMembers.userId, doctorId),
        eq(clinicMembers.role, 'doctor'),
        eq(clinicMembers.isActive, true),
        eq(clinics.status, 'active')
      )
    )
    .limit(1);
  if (!row) throw notFound('This doctor is not available at this clinic');
  return row.clinic;
}

/**
 * Generates free slots for a doctor at a clinic on a clinic-local date
 * (YYYY-MM-DD). All times are computed in the clinic's timezone and returned
 * as UTC ISO strings, so browser and server timezones never matter.
 */
export async function getFreeSlots(doctorId: string, clinic: Clinic, date: string, conn: DbOrTx = db): Promise<Slot[]> {
  const zone = clinic.timezone;
  const day = DateTime.fromISO(date, { zone });
  if (!day.isValid) throw badRequest('Invalid date');

  const now = DateTime.now().setZone(zone);
  const lastBookable = now.startOf('day').plus({ days: clinicSettings(clinic).bookingWindowDays });
  if (day < now.startOf('day') || day > lastBookable) return [];

  const dow = day.weekday % 7; // luxon: Mon=1..Sun=7 → 0=Sun
  const blocks = await conn
    .select()
    .from(doctorAvailability)
    .where(
      and(
        eq(doctorAvailability.doctorId, doctorId),
        eq(doctorAvailability.clinicId, clinic.id),
        eq(doctorAvailability.dayOfWeek, dow)
      )
    );
  if (blocks.length === 0) return [];

  const dayStart = day.startOf('day');
  const dayEnd = dayStart.plus({ days: 1 });
  // A doctor can't be double-booked across clinics either
  const taken = await conn
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        inArray(appointments.status, [...ACTIVE_STATUSES]),
        gte(appointments.startsAt, dayStart.toJSDate()),
        lt(appointments.startsAt, dayEnd.toJSDate())
      )
    );

  const duration = clinicSettings(clinic).slotDurationMinutes;
  const seen = new Set<string>();
  const slots: Slot[] = [];

  for (const block of blocks.sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    const end = minutesOf(block.endTime);
    for (let m = minutesOf(block.startTime); m + duration <= end; m += duration) {
      const start = dayStart.plus({ minutes: m });
      const finish = start.plus({ minutes: duration });
      if (start <= now) continue;
      const overlaps = taken.some((t) => start.toMillis() < t.endsAt.getTime() && finish.toMillis() > t.startsAt.getTime());
      if (overlaps) continue;
      const iso = start.toUTC().toISO()!;
      if (seen.has(iso)) continue;
      seen.add(iso);
      slots.push({ startsAt: iso, endsAt: finish.toUTC().toISO()!, label: start.toFormat('HH:mm') });
    }
  }
  return slots;
}

/** Validates that a requested start time is one of the doctor's free slots. */
export async function assertSlotFree(doctorId: string, clinic: Clinic, startsAtIso: string, conn: DbOrTx = db) {
  const start = DateTime.fromISO(startsAtIso, { zone: clinic.timezone });
  if (!start.isValid) throw badRequest('Invalid time');
  const slots = await getFreeSlots(doctorId, clinic, start.toISODate()!, conn);
  const match = slots.find((s) => DateTime.fromISO(s.startsAt).toMillis() === start.toMillis());
  if (!match) throw badRequest('That time is no longer available. Please pick another slot.', 'SLOT_UNAVAILABLE');
  return { startsAt: new Date(match.startsAt), endsAt: new Date(match.endsAt) };
}

export function validateSchedule(schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) {
  const byDay = new Map<number, Array<[number, number]>>();
  for (const s of schedule) {
    if (!isHHMM(s.startTime) || !isHHMM(s.endTime)) throw badRequest('Times must be HH:MM');
    const range: [number, number] = [minutesOf(s.startTime), minutesOf(s.endTime)];
    if (range[0] >= range[1]) throw badRequest(`Start time must be before end time (${s.startTime}–${s.endTime})`);
    const list = byDay.get(s.dayOfWeek) ?? [];
    if (list.some(([a, b]) => range[0] < b && range[1] > a)) throw badRequest('Availability blocks on the same day overlap');
    list.push(range);
    byDay.set(s.dayOfWeek, list);
  }
}

export function hoursUntil(date: Date) {
  return (date.getTime() - Date.now()) / 3_600_000;
}

export function formatInZone(date: Date, zone: string) {
  return DateTime.fromJSDate(date).setZone(zone).toFormat("ccc, d LLL yyyy 'at' h:mm a");
}

export const scheduleSchema = z.object({
  clinicId: z.string().uuid(),
  schedule: z
    .array(z.object({ dayOfWeek: z.number().int().min(0).max(6), startTime: z.string(), endTime: z.string() }))
    .max(50),
});

export async function replaceSchedule(doctorId: string, clinicId: string, schedule: z.infer<typeof scheduleSchema>['schedule']) {
  validateSchedule(schedule);
  return db.transaction(async (tx) => {
    await tx.delete(doctorAvailability).where(and(eq(doctorAvailability.doctorId, doctorId), eq(doctorAvailability.clinicId, clinicId)));
    if (schedule.length) await tx.insert(doctorAvailability).values(schedule.map((s) => ({ ...s, doctorId, clinicId })));
    return tx
      .select()
      .from(doctorAvailability)
      .where(and(eq(doctorAvailability.doctorId, doctorId), eq(doctorAvailability.clinicId, clinicId)))
      .orderBy(asc(doctorAvailability.dayOfWeek), asc(doctorAvailability.startTime));
  });
}

