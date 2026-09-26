import type { Request } from 'express';
import { eq, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../db/db.js';
import { appointments, clinics, users, type Appointment, type Clinic } from '../db/schema.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/http.js';
import { assertSlotFree, clinicSettings, formatInZone, hoursUntil, loadBookableContext } from './scheduling.js';
import { notify, notifyClinicAdmins } from './notify.js';
import { audit } from './audit.js';
import { sendMail } from './mailer.js';
import { escapeHtml } from './invites.js';
import { env } from '../lib/env.js';

const doctor = alias(users, 'doctor');
const patient = alias(users, 'patient');

export const appointmentSelect = {
  id: appointments.id,
  status: appointments.status,
  startsAt: appointments.startsAt,
  endsAt: appointments.endsAt,
  reason: appointments.reason,
  clinicalNotes: appointments.clinicalNotes,
  proposedStartsAt: appointments.proposedStartsAt,
  rescheduleReason: appointments.rescheduleReason,
  cancellationReason: appointments.cancellationReason,
  cancelledBy: appointments.cancelledBy,
  confirmedAt: appointments.confirmedAt,
  completedAt: appointments.completedAt,
  createdAt: appointments.createdAt,
  patient: { id: patient.id, name: patient.name, email: patient.email, avatarUrl: patient.avatarUrl },
  doctor: { id: doctor.id, name: doctor.name, avatarUrl: doctor.avatarUrl, specialization: doctor.profile },
  clinic: { id: clinics.id, name: clinics.name, timezone: clinics.timezone, address: clinics.address, city: clinics.city },
};

type RawRow = Awaited<ReturnType<typeof baseQuery>>[number];

function baseQuery(where: SQL | undefined) {
  return db
    .select(appointmentSelect)
    .from(appointments)
    .innerJoin(patient, eq(patient.id, appointments.patientId))
    .innerJoin(doctor, eq(doctor.id, appointments.doctorId))
    .innerJoin(clinics, eq(clinics.id, appointments.clinicId))
    .where(where);
}

export function shapeAppointment(row: RawRow) {
  return {
    ...row,
    doctor: { ...row.doctor, specialization: row.doctor.specialization?.specialization ?? null },
  };
}
export type AppointmentDTO = ReturnType<typeof shapeAppointment>;

/** Paginated / filtered appointment listing with joined names. */
export function listAppointments(where: SQL | undefined) {
  return baseQuery(where);
}

export async function getAppointmentDTO(id: string) {
  const [row] = await baseQuery(eq(appointments.id, id)).limit(1);
  if (!row) throw notFound('Appointment not found');
  return shapeAppointment(row);
}

export { patient as patientUser, doctor as doctorUser };

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

type Actor = { id: string; role: 'patient' | 'doctor' | 'clinic_admin' };

async function load(id: string) {
  const [row] = await db
    .select({ appt: appointments, clinic: clinics })
    .from(appointments)
    .innerJoin(clinics, eq(clinics.id, appointments.clinicId))
    .where(eq(appointments.id, id))
    .limit(1);
  if (!row) throw notFound('Appointment not found');
  return row;
}

/** Loads an appointment and checks the actor is a party to it. */
export async function loadForActor(id: string, actor: Actor, clinicScope?: string[] | string) {
  const row = await load(id);
  const { appt } = row;
  const allowed =
    (actor.role === 'patient' && appt.patientId === actor.id) ||
    (actor.role === 'doctor' &&
      appt.doctorId === actor.id &&
      Array.isArray(clinicScope) &&
      clinicScope.includes(appt.clinicId)) ||
    (actor.role === 'clinic_admin' && clinicScope === appt.clinicId);
  if (!allowed) throw notFound('Appointment not found');
  return row;
}

function requireStatus(appt: Appointment, allowed: Appointment['status'][], action: string) {
  if (!allowed.includes(appt.status)) {
    throw conflict(`Cannot ${action} an appointment that is ${appt.status.replace('_', ' ')}`, 'INVALID_STATE');
  }
}

async function update(id: string, patch: Partial<typeof appointments.$inferInsert>) {
  const [updated] = await db
    .update(appointments)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();
  return updated!;
}

const when = (appt: { startsAt: Date }, clinic: Clinic) => formatInZone(appt.startsAt, clinic.timezone);
const patientLink = (id: string) => `/patient/appointments/${id}`;
const doctorLink = (id: string) => `/doctor/appointments/${id}`;
const clinicLink = (id: string) => `/clinic/appointments?focus=${id}`;

async function emailPatient(patientId: string, subject: string, heading: string, body: string, apptId: string) {
  const [p] = await db.select({ email: users.email }).from(users).where(eq(users.id, patientId)).limit(1);
  if (!p) return;
  await sendMail({
    to: p.email,
    subject,
    heading,
    body,
    cta: { label: 'View appointment', url: `${env.appUrl}${patientLink(apptId)}` },
  });
}

// --- booking ---------------------------------------------------------------

export async function book(
  req: Request,
  input: { patientId: string; doctorId: string; clinicId: string; startsAt: string; reason?: string | null; bookedByStaff?: boolean }
) {
  const clinic = await loadBookableContext(input.doctorId, input.clinicId);
  if (input.patientId === input.doctorId) throw badRequest('You cannot book an appointment with yourself');
  const slot = await assertSlotFree(input.doctorId, clinic, input.startsAt);
  const autoConfirm = clinicSettings(clinic).autoConfirm || Boolean(input.bookedByStaff);

  const [created] = await db
    .insert(appointments)
    .values({
      patientId: input.patientId,
      doctorId: input.doctorId,
      clinicId: clinic.id,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      reason: input.reason ?? null,
      status: autoConfirm ? 'confirmed' : 'pending',
      confirmedAt: autoConfirm ? new Date() : null,
    })
    .returning();
  const appt = created!;

  const label = when(appt, clinic);
  await notify({
    userId: input.doctorId,
    clinicId: clinic.id,
    type: 'appointment_booked',
    title: 'New appointment',
    message: `New booking for ${label}.`,
    link: doctorLink(appt.id),
    data: { appointmentId: appt.id },
  });
  await notifyClinicAdmins(clinic.id, {
    type: 'appointment_booked',
    title: 'New appointment',
    message: `A visit was booked for ${label}.`,
    link: clinicLink(appt.id),
    data: { appointmentId: appt.id },
  });
  await notify({
    userId: input.patientId,
    clinicId: clinic.id,
    type: autoConfirm ? 'appointment_confirmed' : 'appointment_booked',
    title: autoConfirm ? 'Appointment confirmed' : 'Appointment requested',
    message: autoConfirm
      ? `Your visit at ${clinic.name} on ${label} is confirmed.`
      : `Your request for ${label} at ${clinic.name} was sent. You'll be notified once it's confirmed.`,
    link: patientLink(appt.id),
    data: { appointmentId: appt.id },
  });
  await emailPatient(
    input.patientId,
    autoConfirm ? 'Your appointment is confirmed' : 'Appointment request received',
    autoConfirm ? 'Appointment confirmed' : 'Request received',
    `${escapeHtml(clinic.name)} — ${escapeHtml(label)}`,
    appt.id
  );
  await audit(req, { action: 'APPOINTMENT_BOOKED', targetType: 'appointment', targetId: appt.id, clinicId: clinic.id });
  return appt;
}

// --- transitions -----------------------------------------------------------

export async function confirm(req: Request, id: string, actor: Actor, scope: string[] | string) {
  const { appt, clinic } = await loadForActor(id, actor, scope);
  requireStatus(appt, ['pending'], 'confirm');
  if (appt.startsAt.getTime() < Date.now()) throw conflict('This appointment time has already passed', 'IN_PAST');
  const updated = await update(id, { status: 'confirmed', confirmedAt: new Date() });
  await notify({
    userId: appt.patientId,
    clinicId: clinic.id,
    type: 'appointment_confirmed',
    title: 'Appointment confirmed',
    message: `Your visit at ${clinic.name} on ${when(appt, clinic)} is confirmed.`,
    link: patientLink(id),
  });
  await emailPatient(appt.patientId, 'Your appointment is confirmed', 'Appointment confirmed', `${escapeHtml(clinic.name)} — ${escapeHtml(when(appt, clinic))}`, id);
  await audit(req, { action: 'APPOINTMENT_CONFIRMED', targetType: 'appointment', targetId: id, clinicId: clinic.id });
  return updated;
}

export async function cancel(req: Request, id: string, actor: Actor, scope: string[] | string | undefined, reason?: string | null) {
  const { appt, clinic } = await loadForActor(id, actor, scope);
  requireStatus(appt, ['pending', 'confirmed', 'reschedule_proposed'], 'cancel');
  if (appt.startsAt.getTime() < Date.now()) throw conflict('Past appointments cannot be cancelled', 'IN_PAST');
  if (actor.role === 'patient' && appt.status === 'confirmed') {
    const limit = clinicSettings(clinic).cancellationHours;
    if (hoursUntil(appt.startsAt) < limit) {
      throw conflict(`Confirmed visits can't be cancelled online less than ${limit} hours before. Please call the clinic.`, 'CANCELLATION_WINDOW');
    }
  }
  const updated = await update(id, {
    status: 'cancelled',
    cancelledAt: new Date(),
    cancelledBy: actor.id,
    cancellationReason: reason ?? null,
    proposedStartsAt: null,
    proposedBy: null,
  });
  const label = when(appt, clinic);
  if (actor.role === 'patient') {
    await notify({
      userId: appt.doctorId,
      clinicId: clinic.id,
      type: 'appointment_cancelled',
      title: 'Appointment cancelled',
      message: `The patient cancelled their visit on ${label}.`,
      link: doctorLink(id),
    });
    await notifyClinicAdmins(clinic.id, {
      type: 'appointment_cancelled',
      title: 'Appointment cancelled',
      message: `A patient cancelled their visit on ${label}.`,
      link: clinicLink(id),
    });
  } else {
    await notify({
      userId: appt.patientId,
      clinicId: clinic.id,
      type: 'appointment_cancelled',
      title: 'Appointment cancelled',
      message: `Your visit at ${clinic.name} on ${label} was cancelled${reason ? `: ${reason}` : '.'}`,
      link: patientLink(id),
    });
    if (actor.role === 'clinic_admin') {
      await notify({
        userId: appt.doctorId,
        clinicId: clinic.id,
        type: 'appointment_cancelled',
        title: 'Appointment cancelled',
        message: `The clinic cancelled a visit on ${label}.`,
        link: doctorLink(id),
      });
    }
    await emailPatient(
      appt.patientId,
      'Your appointment was cancelled',
      'Appointment cancelled',
      `${escapeHtml(clinic.name)} — ${escapeHtml(label)}${reason ? `<br><br>Reason: ${escapeHtml(reason)}` : ''}`,
      id
    );
  }
  await audit(req, { action: 'APPOINTMENT_CANCELLED', targetType: 'appointment', targetId: id, clinicId: clinic.id, metadata: { reason } });
  return updated;
}

const EARLY_COMPLETE_MINUTES = 15;

export async function complete(req: Request, id: string, actor: Actor, scope: string[], clinicalNotes?: string | null) {
  const { appt, clinic } = await loadForActor(id, actor, scope);
  requireStatus(appt, ['pending', 'confirmed'], 'complete');
  if (appt.startsAt.getTime() - Date.now() > EARLY_COMPLETE_MINUTES * 60_000) {
    throw conflict(`An appointment can be completed from ${EARLY_COMPLETE_MINUTES} minutes before its start time`, 'TOO_EARLY');
  }
  const updated = await update(id, {
    status: 'completed',
    completedAt: new Date(),
    ...(clinicalNotes !== undefined ? { clinicalNotes } : {}),
  });
  await notify({
    userId: appt.patientId,
    clinicId: clinic.id,
    type: 'appointment_completed',
    title: 'Visit completed',
    message: `Your visit at ${clinic.name} has been completed.`,
    link: patientLink(id),
  });
  await audit(req, { action: 'APPOINTMENT_COMPLETED', targetType: 'appointment', targetId: id, clinicId: clinic.id });
  return updated;
}

export async function markNoShow(req: Request, id: string, actor: Actor, scope: string[] | string) {
  const { appt, clinic } = await loadForActor(id, actor, scope);
  requireStatus(appt, ['pending', 'confirmed'], 'mark as no-show');
  if (appt.startsAt.getTime() > Date.now()) throw conflict('Only past appointments can be marked as no-show', 'TOO_EARLY');
  const updated = await update(id, { status: 'no_show' });
  await audit(req, { action: 'APPOINTMENT_NO_SHOW', targetType: 'appointment', targetId: id, clinicId: clinic.id });
  return updated;
}

export async function proposeReschedule(
  req: Request,
  id: string,
  actor: Actor,
  scope: string[] | string,
  startsAt: string,
  reason?: string | null
) {
  const { appt, clinic } = await loadForActor(id, actor, scope);
  requireStatus(appt, ['pending', 'confirmed'], 'reschedule');
  const slot = await assertSlotFree(appt.doctorId, clinic, startsAt);
  const updated = await update(id, {
    status: 'reschedule_proposed',
    proposedStartsAt: slot.startsAt,
    proposedBy: actor.id,
    rescheduleReason: reason ?? null,
  });
  const newLabel = formatInZone(slot.startsAt, clinic.timezone);
  await notify({
    userId: appt.patientId,
    clinicId: clinic.id,
    type: 'appointment_reschedule',
    title: 'New time proposed',
    message: `${clinic.name} proposed moving your visit to ${newLabel}. Please accept or decline.`,
    link: patientLink(id),
  });
  await emailPatient(
    appt.patientId,
    'A new time was proposed for your appointment',
    'New time proposed',
    `Proposed: <strong>${escapeHtml(newLabel)}</strong>${reason ? `<br><br>Reason: ${escapeHtml(reason)}` : ''}`,
    id
  );
  await audit(req, {
    action: 'APPOINTMENT_RESCHEDULE_PROPOSED',
    targetType: 'appointment',
    targetId: id,
    clinicId: clinic.id,
    metadata: { from: appt.startsAt.toISOString(), to: slot.startsAt.toISOString(), reason },
  });
  return updated;
}

export async function respondToProposal(req: Request, id: string, actor: Actor, accept: boolean) {
  if (actor.role !== 'patient') throw forbidden();
  const { appt, clinic } = await loadForActor(id, actor);
  requireStatus(appt, ['reschedule_proposed'], 'respond to');
  if (!appt.proposedStartsAt) throw conflict('No proposal found');

  let updated;
  if (accept) {
    // Release the current slot before re-validating the proposed one
    const slot = await db.transaction(async (tx) => {
      await tx.update(appointments).set({ status: 'cancelled' }).where(eq(appointments.id, id));
      const s = await assertSlotFree(appt.doctorId, clinic, appt.proposedStartsAt!.toISOString(), tx);
      await tx
        .update(appointments)
        .set({
          status: 'confirmed',
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          confirmedAt: new Date(),
          proposedStartsAt: null,
          proposedBy: null,
          rescheduleReason: null,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, id));
      return s;
    });
    updated = await getAppointmentDTO(id);
    const label = formatInZone(slot.startsAt, clinic.timezone);
    await notify({
      userId: appt.doctorId,
      clinicId: clinic.id,
      type: 'appointment_reschedule',
      title: 'New time accepted',
      message: `The patient accepted the new time: ${label}.`,
      link: doctorLink(id),
    });
    await notifyClinicAdmins(clinic.id, {
      type: 'appointment_reschedule',
      title: 'New time accepted',
      message: `A patient accepted the new time: ${label}.`,
      link: clinicLink(id),
    });
  } else {
    updated = await update(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: actor.id,
      cancellationReason: 'Patient declined the proposed new time',
      proposedStartsAt: null,
      proposedBy: null,
    });
    await notify({
      userId: appt.doctorId,
      clinicId: clinic.id,
      type: 'appointment_cancelled',
      title: 'New time declined',
      message: `The patient declined the proposed time, so the visit on ${when(appt, clinic)} was cancelled.`,
      link: doctorLink(id),
    });
  }
  await audit(req, {
    action: accept ? 'APPOINTMENT_RESCHEDULE_ACCEPTED' : 'APPOINTMENT_RESCHEDULE_DECLINED',
    targetType: 'appointment',
    targetId: id,
    clinicId: clinic.id,
  });
  return updated;
}

/** Patient moves their own appointment to another free slot. */
export async function patientReschedule(req: Request, id: string, actor: Actor, startsAt: string) {
  const { appt, clinic } = await loadForActor(id, actor);
  requireStatus(appt, ['pending', 'confirmed'], 'reschedule');
  const settings = clinicSettings(clinic);
  if (appt.status === 'confirmed' && hoursUntil(appt.startsAt) < settings.cancellationHours) {
    throw conflict(`Confirmed visits can't be moved online less than ${settings.cancellationHours} hours before.`, 'CANCELLATION_WINDOW');
  }
  const slot = await assertSlotFree(appt.doctorId, clinic, startsAt);
  const updated = await update(id, {
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    status: settings.autoConfirm ? 'confirmed' : 'pending',
    confirmedAt: settings.autoConfirm ? new Date() : null,
  });
  const label = formatInZone(slot.startsAt, clinic.timezone);
  await notify({
    userId: appt.doctorId,
    clinicId: clinic.id,
    type: 'appointment_reschedule',
    title: 'Appointment moved',
    message: `A patient moved their visit to ${label}.`,
    link: doctorLink(id),
  });
  await notifyClinicAdmins(clinic.id, {
    type: 'appointment_reschedule',
    title: 'Appointment moved',
    message: `A patient moved their visit to ${label}.`,
    link: clinicLink(id),
  });
  await audit(req, {
    action: 'APPOINTMENT_RESCHEDULED_BY_PATIENT',
    targetType: 'appointment',
    targetId: id,
    clinicId: clinic.id,
    metadata: { from: appt.startsAt.toISOString(), to: slot.startsAt.toISOString() },
  });
  return updated;
}

export async function setClinicalNotes(req: Request, id: string, actor: Actor, scope: string[], clinicalNotes: string) {
  const { appt, clinic } = await loadForActor(id, actor, scope);
  if (appt.status === 'cancelled') throw conflict('Cannot add notes to a cancelled appointment', 'INVALID_STATE');
  const updated = await update(id, { clinicalNotes });
  await audit(req, { action: 'APPOINTMENT_NOTES_UPDATED', targetType: 'appointment', targetId: id, clinicId: clinic.id });
  return updated;
}
