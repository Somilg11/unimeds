import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users, records, appointments, clinics, auditLogs, notifications, doctorAvailability, clinicDoctors } from '../db/schema.js';
import { eq, or, ilike, desc, and, sql, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { generateSignedUploadUrl } from '../lib/cloudinary.js';

export const doctorLogin = async (req: Request, res: Response) => {
  try {
    const { authId } = req.body;

    if (!authId) {
      return res.status(400).json({ error: 'Auth ID is required' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.authId, authId), eq(users.role, 'doctor')))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.authId, authId: user.authId },
      process.env.AUTH_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    const profileData = user.profileData as Record<string, unknown> | null;

    res.json({
      token,
      user: {
        id: user.id,
        name: profileData?.name || 'Doctor',
        email: profileData?.email || '',
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during doctor login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const searchPatients = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const { q } = req.query;
    const searchTerm = q as string | undefined;

    const conditions = [eq(users.role, 'patient')];

    if (searchTerm) {
      conditions.push(
        or(
          sql`(${users.profileData})::json->>'name' ILIKE ${'%' + searchTerm + '%'}`,
          sql`(${users.profileData})::json->>'phone' ILIKE ${'%' + searchTerm + '%'}`,
          sql`(${users.profileData})::json->>'medicalIdentifier' ILIKE ${'%' + searchTerm + '%'}`,
          sql`(${users.profileData})::json->>'email' ILIKE ${'%' + searchTerm + '%'}`
        )!
      );
    }

    const patients = await db
      .select({
        patientId: users.id,
        name: sql<string>`(${users.profileData})::json->>'name'`,
        email: sql<string>`(${users.profileData})::json->>'email'`,
        phone: sql<string>`(${users.profileData})::json->>'phone'`,
        dateOfBirth: sql<string>`(${users.profileData})::json->>'dateOfBirth'`,
        gender: sql<string>`(${users.profileData})::json->>'gender'`,
        totalAppointments: sql<number>`count(${appointments.id})`,
        lastAppointment: sql<string>`max(${appointments.slotTime}::text)`,
      })
      .from(users)
      .leftJoin(appointments, eq(appointments.patientId, users.id))
      .where(and(...conditions))
      .groupBy(users.id)
      .orderBy(sql`max(${appointments.slotTime}) desc nulls last`);

    res.json({ patients });
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
};

export const getPatientContext = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    // Verify doctor has a relationship with this patient (via appointment or shared clinic)
    const [hasAppointment] = await db
      .select({ patientId: appointments.patientId })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.patientId, id)
        )
      )
      .limit(1);

    const [hasSharedClinic] = await db
      .select({ clinicId: clinicDoctors.clinicId })
      .from(clinicDoctors)
      .innerJoin(appointments, eq(clinicDoctors.clinicId, appointments.clinicId))
      .where(
        and(
          eq(clinicDoctors.doctorId, doctorId),
          eq(appointments.patientId, id),
          eq(clinicDoctors.isActive, true)
        )
      )
      .limit(1);

    if (!hasAppointment && !hasSharedClinic) {
      return res.status(403).json({ error: 'No relationship found with this patient' });
    }

    // Get patient details
    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get patient's records
    const patientRecords = await db
      .select()
      .from(records)
      .where(eq(records.patientId, id))
      .orderBy(desc(records.createdAt));

    // Get patient's appointments with this doctor
    const patientAppointments = await db
      .select({
        id: appointments.id,
        slotTime: appointments.slotTime,
        status: appointments.status,
        notes: appointments.notes,
        clinicName: clinics.name,
      })
      .from(appointments)
      .innerJoin(clinics, eq(appointments.clinicId, clinics.id))
      .where(
        and(
          eq(appointments.patientId, id),
          eq(appointments.doctorId, doctorId)
        )
      )
      .orderBy(desc(appointments.slotTime));

    res.json({
      patient,
      records: patientRecords,
      appointments: patientAppointments,
    });
  } catch (error) {
    console.error('Error fetching patient context:', error);
    res.status(500).json({ error: 'Failed to fetch patient context' });
  }
};

export const addAppointmentNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    // Verify appointment belongs to this doctor
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.doctorId, doctorId)));

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update appointment with notes
    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        notes,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: doctorId,
      action: 'APPOINTMENT_NOTES_ADDED',
      targetResource: `appointments:${id}`,
      metadata: {
        changes: { notes },
      },
    });

    res.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    console.error('Error adding appointment notes:', error);
    res.status(500).json({ error: 'Failed to add appointment notes' });
  }
};

export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const doctorAppointments = await db
      .select({
        id: appointments.id,
        slotTime: appointments.slotTime,
        status: appointments.status,
        notes: appointments.notes,
        patientName: sql<string>`(${users.profileData})::json->>'name'`,
        clinicName: clinics.name,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.patientId, users.id))
      .innerJoin(clinics, eq(appointments.clinicId, clinics.id))
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.slotTime));

    res.json({ appointments: doctorAppointments });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getDoctorRecords = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const doctorRecords = await db
      .select({
        id: records.id,
        fileUrl: records.fileUrl,
        recordType: records.recordType,
        fileName: records.fileName,
        fileSize: records.fileSize,
        mimeType: records.mimeType,
        ocrData: records.ocrData,
        createdAt: records.createdAt,
        patientId: records.patientId,
        uploadedBy: records.uploadedBy,
        patientName: sql<string>`(${users.profileData})::json->>'name'`,
      })
      .from(records)
      .innerJoin(appointments, and(
        eq(records.patientId, appointments.patientId),
        eq(appointments.doctorId, doctorId)
      ))
      .innerJoin(users, eq(records.patientId, users.id))
      .groupBy(records.id, users.id)
      .orderBy(desc(records.createdAt));

    res.json({ records: doctorRecords });
  } catch (error) {
    console.error('Error fetching doctor records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

export const uploadRecordForPatient = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const { patientId, fileName, fileType, recordType } = req.body;

    if (!patientId || !fileName) {
      return res.status(400).json({ error: 'patientId and fileName are required' });
    }

    // Verify doctor has a relationship with this patient (via appointment or same clinic)
    const [relationship] = await db
      .select({ patientId: appointments.patientId })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.patientId, patientId)
        )
      )
      .limit(1);

    // Also check if doctor shares a clinic with the patient's appointments
    const [clinicRelationship] = await db
      .select({ clinicId: clinicDoctors.clinicId })
      .from(clinicDoctors)
      .innerJoin(appointments, eq(clinicDoctors.clinicId, appointments.clinicId))
      .where(
        and(
          eq(clinicDoctors.doctorId, doctorId),
          eq(appointments.patientId, patientId),
          eq(clinicDoctors.isActive, true)
        )
      )
      .limit(1);

    if (!relationship && !clinicRelationship) {
      return res.status(403).json({ error: 'No relationship found with this patient' });
    }

    const { uploadUrl, signature, timestamp, publicId } = generateSignedUploadUrl(fileName);

    const [newRecord] = await db.insert(records).values({
      patientId,
      uploadedBy: doctorId,
      fileUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${publicId}`,
      recordType: recordType || 'general',
      fileName,
      mimeType: fileType,
      ocrData: {
        processingStatus: 'pending',
      },
    }).returning();

    if (!newRecord) {
      return res.status(500).json({ error: 'Failed to create record' });
    }

    await db.insert(notifications).values({
      userId: patientId,
      type: 'record_uploaded',
      title: 'New Record Uploaded',
      message: `A doctor has uploaded a new medical record for you.`,
      data: { recordId: newRecord.id, uploadedBy: doctorId },
    });

    res.json({
      uploadUrl,
      signature,
      timestamp,
      recordId: newRecord.id,
      publicId,
    });
  } catch (error) {
    console.error('Error uploading record for patient:', error);
    res.status(500).json({ error: 'Failed to upload record' });
  }
};

export const getPatientMedicalHistory = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const { id: patientId } = req.params;
    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    // Verify doctor has a relationship with this patient
    const [hasAppointment] = await db
      .select({ patientId: appointments.patientId })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.patientId, patientId)
        )
      )
      .limit(1);

    const [hasSharedClinic] = await db
      .select({ clinicId: clinicDoctors.clinicId })
      .from(clinicDoctors)
      .innerJoin(appointments, eq(clinicDoctors.clinicId, appointments.clinicId))
      .where(
        and(
          eq(clinicDoctors.doctorId, doctorId),
          eq(appointments.patientId, patientId),
          eq(clinicDoctors.isActive, true)
        )
      )
      .limit(1);

    if (!hasAppointment && !hasSharedClinic) {
      return res.status(403).json({ error: 'No relationship found with this patient' });
    }

    const patientRecords = await db
      .select({
        id: records.id,
        fileUrl: records.fileUrl,
        recordType: records.recordType,
        fileName: records.fileName,
        fileSize: records.fileSize,
        mimeType: records.mimeType,
        ocrData: records.ocrData,
        uploadedBy: records.uploadedBy,
        createdAt: records.createdAt,
        uploaderName: sql<string>`(${users.profileData})::json->>'name'`,
      })
      .from(records)
      .leftJoin(users, eq(records.uploadedBy, users.id))
      .where(eq(records.patientId, patientId))
      .orderBy(desc(records.createdAt));

    const patientAppointments = await db
      .select({
        id: appointments.id,
        slotTime: appointments.slotTime,
        status: appointments.status,
        notes: appointments.notes,
        proposedTime: appointments.proposedTime,
        proposedBy: appointments.proposedBy,
        rescheduleReason: appointments.rescheduleReason,
        doctorName: sql<string>`(${users.profileData})::json->>'name'`,
        clinicName: clinics.name,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .innerJoin(clinics, eq(appointments.clinicId, clinics.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.slotTime));

    res.json({
      records: patientRecords,
      appointments: patientAppointments,
    });
  } catch (error) {
    console.error('Error fetching patient medical history:', error);
    res.status(500).json({ error: 'Failed to fetch patient medical history' });
  }
};

export const getMyAvailability = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const availability = await db
      .select()
      .from(doctorAvailability)
      .where(eq(doctorAvailability.doctorId, doctorId))
      .orderBy(doctorAvailability.dayOfWeek, doctorAvailability.startTime);

    res.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

export const setMyAvailability = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const { clinicId, schedule } = req.body;

    if (!clinicId || !Array.isArray(schedule)) {
      return res.status(400).json({ error: 'clinicId and schedule (array) are required' });
    }

    // Verify doctor belongs to this clinic
    const [clinicLink] = await db
      .select()
      .from(clinicDoctors)
      .where(
        and(
          eq(clinicDoctors.doctorId, doctorId),
          eq(clinicDoctors.clinicId, clinicId),
          eq(clinicDoctors.isActive, true)
        )
      )
      .limit(1);

    if (!clinicLink) {
      return res.status(403).json({ error: 'Doctor is not associated with this clinic' });
    }

    // Delete existing availability for this doctor at this clinic
    await db
      .delete(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.doctorId, doctorId),
          eq(doctorAvailability.clinicId, clinicId)
        )
      );

    // Insert new schedule
    if (schedule.length > 0) {
      const entries = schedule.map((s: { dayOfWeek: number; startTime: string; endTime: string }) => ({
        doctorId,
        clinicId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: true,
      }));

      await db.insert(doctorAvailability).values(entries);
    }

    const updated = await db
      .select()
      .from(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.doctorId, doctorId),
          eq(doctorAvailability.clinicId, clinicId)
        )
      )
      .orderBy(doctorAvailability.dayOfWeek, doctorAvailability.startTime);

    res.json({ success: true, availability: updated });
  } catch (error) {
    console.error('Error setting availability:', error);
    res.status(500).json({ error: 'Failed to set availability' });
  }
};

export const deleteAvailabilitySlot = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid availability ID' });
    }

    const [existing] = await db
      .select()
      .from(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.id, id),
          eq(doctorAvailability.doctorId, doctorId)
        )
      );

    if (!existing) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    await db.delete(doctorAvailability).where(eq(doctorAvailability.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting availability slot:', error);
    res.status(500).json({ error: 'Failed to delete availability slot' });
  }
};

export const proposeReschedule = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const { id } = req.params;
    const { proposedTime, reason } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    if (!proposedTime) {
      return res.status(400).json({ error: 'proposedTime is required' });
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, id),
          eq(appointments.doctorId, doctorId),
          inArray(appointments.status, ['pending', 'confirmed'])
        )
      );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not reschedulable' });
    }

    // Check for conflicts at the proposed time
    const proposedDate = new Date(proposedTime);
    const [conflict] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.clinicId, appointment.clinicId),
          eq(appointments.slotTime, proposedDate),
          or(
            eq(appointments.status, 'confirmed'),
            eq(appointments.status, 'pending')
          ),
          sql`${appointments.id} != ${id}`
        )
      );

    if (conflict) {
      return res.status(409).json({ error: 'The proposed time slot is already booked' });
    }

    const [updated] = await db
      .update(appointments)
      .set({
        status: 'reschedule_proposed',
        proposedTime: proposedDate,
        proposedBy: doctorId,
        rescheduleReason: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    // Notify patient
    await db.insert(notifications).values({
      userId: appointment.patientId,
      clinicId: appointment.clinicId,
      type: 'general',
      title: 'Reschedule Proposal',
      message: `Your doctor has proposed a new appointment time. Please accept or decline.`,
      data: {
        appointmentId: id,
        proposedTime,
        reason,
      },
    });

    await db.insert(auditLogs).values({
      userId: doctorId,
      action: 'APPOINTMENT_RESCHEDULE_PROPOSED',
      targetResource: `appointments:${id}`,
      metadata: {
        changes: { proposedTime, reason },
        previousState: { slotTime: appointment.slotTime, status: appointment.status },
      },
    });

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Error proposing reschedule:', error);
    res.status(500).json({ error: 'Failed to propose reschedule' });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    res.json({ notifications: userNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { notificationId, all } = req.body;

    if (all) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.userId, userId));
      return res.json({ success: true });
    }

    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' });
    }

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, notification: updated });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const completeAppointment = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ error: 'Doctor not authenticated' });
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, id),
          eq(appointments.doctorId, doctorId)
        )
      );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot complete a cancelled appointment' });
    }

    const [updated] = await db
      .update(appointments)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    await db.insert(notifications).values({
      userId: appointment.patientId,
      clinicId: appointment.clinicId,
      type: 'general',
      title: 'Appointment Completed',
      message: `Your appointment has been marked as completed by the doctor.`,
      data: { appointmentId: id },
    });

    const clinicAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.role, 'clinic_admin'),
        sql`(${users.profileData})::json->>'clinicId' = ${appointment.clinicId}`
      ));

    for (const admin of clinicAdmins) {
      await db.insert(notifications).values({
        userId: admin.id,
        clinicId: appointment.clinicId,
        type: 'general',
        title: 'Appointment Completed',
        message: `An appointment has been marked as completed.`,
        data: { appointmentId: id, doctorId, patientId: appointment.patientId },
      });
    }

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ error: 'Failed to complete appointment' });
  }
};
