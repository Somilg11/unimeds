import { and, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/db.js';
import { appointments, clinicMembers, clinics, records } from '../db/schema.js';
import { ACTIVE_STATUSES } from './scheduling.js';
import { forbidden } from '../lib/http.js';

// Days after a completed visit that a doctor keeps access to the patient's shared records
export const POST_VISIT_ACCESS_DAYS = 14;

/** Clinics where the doctor currently practises (membership active, clinic active). */
export async function doctorClinicIds(doctorId: string): Promise<string[]> {
  const rows = await db
    .select({ clinicId: clinicMembers.clinicId })
    .from(clinicMembers)
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(
      and(
        eq(clinicMembers.userId, doctorId),
        eq(clinicMembers.role, 'doctor'),
        eq(clinicMembers.isActive, true),
        eq(clinics.status, 'active')
      )
    );
  return rows.map((r) => r.clinicId);
}

export async function requireDoctorClinics(doctorId: string) {
  const ids = await doctorClinicIds(doctorId);
  if (ids.length === 0) throw forbidden('You are not an active member of any clinic');
  return ids;
}

/** A doctor may see a patient only if they have an appointment together at one of the doctor's clinics. */
export async function assertDoctorPatient(doctorId: string, patientId: string, clinicIds: string[]) {
  const [row] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.patientId, patientId),
        inArray(appointments.clinicId, clinicIds)
      )
    )
    .limit(1);
  if (!row) throw forbidden('This patient is not under your care');
}

/**
 * Records a doctor may read: ones they uploaded, ones attached to their
 * appointments, and a patient's general records while there is an active
 * care relationship (upcoming visit, or a visit completed recently).
 */
export function doctorRecordAccess(doctorId: string, clinicIds: string[]): SQL {
  const since = new Date(Date.now() - POST_VISIT_ACCESS_DAYS * 86_400_000);
  return or(
    eq(records.uploadedBy, doctorId),
    sql`${records.appointmentId} in (select ap.id from appointments ap where ap.doctor_id = ${doctorId})`,
    sql`exists (
      select 1 from appointments a
      where a.patient_id = "records"."patient_id"
        and a.doctor_id = ${doctorId}
        and a.clinic_id in (${sql.join(
          clinicIds.map((id) => sql`${id}`),
          sql`, `
        )})
        and (a.status in (${sql.join(
          ACTIVE_STATUSES.map((s) => sql`${s}`),
          sql`, `
        )}) or (a.status = 'completed' and a.completed_at >= ${since}))
    )`
  )!;
}
