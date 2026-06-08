import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users, records, appointments } from '../db/schema.js';
import { eq, and, desc, or } from 'drizzle-orm';
import { generateSignedUploadUrl } from '../lib/cloudinary.js';

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { authId, role, profileData } = req.body;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authId));

    if (existingUser) {
      return res.json({ success: true, user: existingUser });
    }

    // Create new user
    const [newUser] = await db.insert(users).values({
      authId,
      role: role || 'patient',
      profileData,
    }).returning();

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
};

export const getTimeline = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user's records
    const userRecords = await db
      .select()
      .from(records)
      .where(eq(records.patientId, userId))
      .orderBy(desc(records.createdAt));

    // Get user's appointments
    const userAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, userId))
      .orderBy(desc(appointments.slotTime));

    // Combine and sort chronologically
    const timeline = [
      ...userRecords.map((record) => ({
        type: 'record',
        date: record.createdAt,
        data: record,
      })),
      ...userAppointments.map((appointment) => ({
        type: 'appointment',
        date: appointment.slotTime,
        data: appointment,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ timeline });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
};

export const uploadRecord = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, recordType } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Generate Cloudinary signed upload URL
    const { uploadUrl, signature, timestamp, publicId } = generateSignedUploadUrl(fileName);

    // Create record entry with pending status
    const [newRecord] = await db.insert(records).values({
      patientId: userId,
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

    res.json({
      uploadUrl,
      signature,
      timestamp,
      recordId: newRecord.id,
      publicId,
    });
  } catch (error) {
    console.error('Error uploading record:', error);
    res.status(500).json({ error: 'Failed to upload record' });
  }
};

export const processOCR = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    // Verify record belongs to user
    const [record] = await db
      .select()
      .from(records)
      .where(and(eq(records.id, id), eq(records.patientId, userId)));

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // In a real implementation, this would trigger the FastAPI OCR pipeline
    // For now, we'll update the status to processing
    await db
      .update(records)
      .set({
        ocrData: {
          ...(record?.ocrData || {}),
          processingStatus: 'processing',
        },
      })
      .where(eq(records.id, id));

    res.json({
      status: 'processing',
      message: 'OCR pipeline initiated',
    });
  } catch (error) {
    console.error('Error processing OCR:', error);
    res.status(500).json({ error: 'Failed to process OCR' });
  }
};

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const { doctorId, clinicId, slotTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check for conflicting appointments
    const slotDate = new Date(slotTime);
    const startOfDay = new Date(slotDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(slotDate.setHours(23, 59, 59, 999));

    const [conflict] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, 'confirmed')
        )
      );

    if (conflict) {
      return res.status(409).json({ error: 'Slot already booked' });
    }

    // Create appointment
    const [newAppointment] = await db.insert(appointments).values({
      patientId: userId,
      doctorId,
      clinicId,
      slotTime: new Date(slotTime),
      status: 'pending',
    }).returning();

    res.json({ success: true, appointment: newAppointment });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { profileData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
