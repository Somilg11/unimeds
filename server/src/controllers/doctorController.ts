import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users, records, appointments, clinics, auditLogs } from '../db/schema.js';
import { eq, or, ilike, desc, and, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

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
    const { q } = req.query;
    const searchTerm = q as string;

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search query required' });
    }

    // Search patients by name, phone, or medical identifier in profileData
    const patients = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'patient'),
          or(
            ilike(users.profileData, `%${searchTerm}%`)
          )
        )
      );

    res.json({ patients });
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
};

export const getPatientContext = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid patient ID' });
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

    // Get patient's appointments
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
      .where(eq(appointments.patientId, id))
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
        patientName: users.profileData,
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
        patientName: sql<string>`(${users.profileData})::json->>'name'`,
      })
      .from(records)
      .innerJoin(appointments, eq(records.patientId, appointments.patientId))
      .innerJoin(users, eq(records.patientId, users.id))
      .where(eq(appointments.doctorId, doctorId))
      .groupBy(records.id, users.id)
      .orderBy(desc(records.createdAt));

    res.json({ records: doctorRecords });
  } catch (error) {
    console.error('Error fetching doctor records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};
