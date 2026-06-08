import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users, records, appointments, clinics } from '../db/schema.js';
import { eq, or, ilike, desc, and } from 'drizzle-orm';

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
