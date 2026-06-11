import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users, records, appointments, clinics, clinicDoctors, notifications } from '../db/schema.js';
import { eq, and, desc, or, gte, lte, isNotNull, isNull, inArray, count } from 'drizzle-orm';
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
    const { doctorId, clinicId, slotTime, reason, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!doctorId || !clinicId || !slotTime) {
      return res.status(400).json({ error: 'doctorId, clinicId, and slotTime are required' });
    }

    // Check for conflicting appointments at the same time slot
    const slotDate = new Date(slotTime);
    const [conflict] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.clinicId, clinicId),
          eq(appointments.slotTime, slotDate),
          or(
            eq(appointments.status, 'confirmed'),
            eq(appointments.status, 'pending')
          )
        )
      );

    if (conflict) {
      return res.status(409).json({ error: 'Slot already booked' });
    }

    // Create appointment
    const appointmentNotes = [reason, notes].filter(Boolean).join('\n---\n') || null;
    const [newAppointment] = await db.insert(appointments).values({
      patientId: userId,
      doctorId,
      clinicId,
      slotTime: slotDate,
      status: 'pending',
      notes: appointmentNotes,
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

export const getClinics = async (req: Request, res: Response) => {
  try {
    const allClinics = await db
      .select({
        id: clinics.id,
        name: clinics.name,
        settings: clinics.settings,
      })
      .from(clinics);

    res.json({ clinics: allClinics });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
};

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const { clinicId } = req.query;

    if (clinicId && typeof clinicId === 'string') {
      const clinicDoctorsList = await db
        .select({
          id: users.id,
          profileData: users.profileData,
        })
        .from(users)
        .innerJoin(clinicDoctors, eq(users.id, clinicDoctors.doctorId))
        .where(
          and(
            eq(users.role, 'doctor'),
            eq(clinicDoctors.clinicId, clinicId),
            eq(clinicDoctors.isActive, true)
          )
        );

      res.json({ doctors: clinicDoctorsList });
    } else {
      const allDoctors = await db
        .select({
          id: users.id,
          profileData: users.profileData,
        })
        .from(users)
        .where(eq(users.role, 'doctor'));

      res.json({ doctors: allDoctors });
    }
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || typeof doctorId !== 'string') {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date is required' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get booked slots for the doctor on the given date
    const bookedSlots = await db
      .select({ slotTime: appointments.slotTime })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.slotTime, startOfDay),
          lte(appointments.slotTime, endOfDay),
          or(
            eq(appointments.status, 'confirmed'),
            eq(appointments.status, 'pending')
          )
        )
      );

    const bookedTimes = new Set(bookedSlots.map(s => s.slotTime.toISOString()));

    // Generate available slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    const slotDuration = 30; // minutes
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Skip if slot is in the past
        if (slotTime < new Date()) continue;

        const slotTimeISO = slotTime.toISOString();
        if (!bookedTimes.has(slotTimeISO)) {
          availableSlots.push({
            id: `${doctorId}-${slotTimeISO}`,
            doctorId,
            date,
            startTime: slotTime.toTimeString().slice(0, 5),
            endTime: new Date(slotTime.getTime() + slotDuration * 60000).toTimeString().slice(0, 5),
            available: true,
          });
        }
      }
    }

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: { id: user.id, profileData: user.profileData, role: user.role } });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
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

    const { notificationId } = req.body;
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
