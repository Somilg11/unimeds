import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users, records, appointments, clinics, clinicDoctors, notifications, doctorAvailability } from '../db/schema.js';
import { eq, and, desc, or, gte, lte, isNotNull, isNull, inArray, count, sql } from 'drizzle-orm';
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
      uploadedBy: userId,
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

export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    const [record] = await db
      .select()
      .from(records)
      .where(and(eq(records.id, id), eq(records.patientId, userId)));

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await db.delete(records).where(eq(records.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
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

    // Notify doctor
    if (newAppointment) {
      await db.insert(notifications).values({
        userId: doctorId,
        clinicId,
        type: 'appointment_booked',
        title: 'New Appointment Booked',
        message: `A patient has booked an appointment.`,
        data: { appointmentId: newAppointment.id, slotTime: slotDate.toISOString() },
      });
    }

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
        address: clinics.address,
        city: clinics.city,
        state: clinics.state,
        zipCode: clinics.zipCode,
        latitude: clinics.latitude,
        longitude: clinics.longitude,
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

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    // Get doctor's availability for this day of week
    const availability = await db
      .select()
      .from(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.doctorId, doctorId),
          eq(doctorAvailability.dayOfWeek, dayOfWeek),
          eq(doctorAvailability.isActive, true)
        )
      );

    // If no availability set, fall back to default 9-5
    const timeBlocks = availability.length > 0
      ? availability.map((a) => ({ start: a.startTime, end: a.endTime }))
      : [{ start: '09:00', end: '17:00' }];

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

    // Generate available slots based on availability blocks
    const availableSlots = [];
    const slotDuration = 30; // minutes

    for (const block of timeBlocks) {
      const parts = block.start.split(':').map(Number);
      const endParts = block.end.split(':').map(Number);
      const startHour = parts[0] ?? 9;
      const startMin = parts[1] ?? 0;
      const endHour = endParts[0] ?? 17;
      const endMin = endParts[1] ?? 0;

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = (hour === startHour ? startMin : 0); minute < 60; minute += slotDuration) {
          if (hour === endHour - 1 && minute >= endMin) break;

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
              startTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
              endTime: new Date(slotTime.getTime() + slotDuration * 60000).toTimeString().slice(0, 5),
              available: true,
            });
          }
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

export const getMedicalHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userRecords = await db
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
      .where(eq(records.patientId, userId))
      .orderBy(desc(records.createdAt));

    const userAppointments = await db
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
      .where(eq(appointments.patientId, userId))
      .orderBy(desc(appointments.slotTime));

    res.json({
      records: userRecords,
      appointments: userAppointments,
    });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
};

export const respondToReschedule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { accept } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    if (typeof accept !== 'boolean') {
      return res.status(400).json({ error: 'accept (boolean) is required' });
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, id),
          eq(appointments.patientId, userId),
          eq(appointments.status, 'reschedule_proposed')
        )
      );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not in reschedule_proposed status' });
    }

    if (accept) {
      // Check for conflicts at the proposed time
      const proposedTime = appointment.proposedTime;
      if (!proposedTime) {
        return res.status(400).json({ error: 'No proposed time found' });
      }

      const [conflict] = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, appointment.doctorId),
            eq(appointments.clinicId, appointment.clinicId),
            eq(appointments.slotTime, proposedTime),
            or(
              eq(appointments.status, 'confirmed'),
              eq(appointments.status, 'pending')
            ),
            sql`${appointments.id} != ${id}`
          )
        );

      if (conflict) {
        return res.status(409).json({ error: 'The proposed time slot is no longer available' });
      }

      // Accept reschedule: update slot time, reset status, clear proposal fields
      const [updated] = await db
        .update(appointments)
        .set({
          slotTime: proposedTime,
          status: 'pending',
          proposedTime: null,
          proposedBy: null,
          rescheduleReason: null,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, id))
        .returning();

      // Notify doctor
      await db.insert(notifications).values({
        userId: appointment.doctorId,
        clinicId: appointment.clinicId,
        type: 'general',
        title: 'Reschedule Accepted',
        message: `Patient has accepted the rescheduled appointment.`,
        data: { appointmentId: id, newTime: proposedTime },
      });

      res.json({ success: true, appointment: updated });
    } else {
      // Decline reschedule: cancel appointment
      const [updated] = await db
        .update(appointments)
        .set({
          status: 'cancelled',
          proposedTime: null,
          proposedBy: null,
          rescheduleReason: null,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, id))
        .returning();

      // Notify doctor
      await db.insert(notifications).values({
        userId: appointment.doctorId,
        clinicId: appointment.clinicId,
        type: 'appointment_cancelled',
        title: 'Reschedule Declined',
        message: `Patient has declined the rescheduled appointment. The appointment has been cancelled.`,
        data: { appointmentId: id },
      });

      res.json({ success: true, appointment: updated });
    }
  } catch (error) {
    console.error('Error responding to reschedule:', error);
    res.status(500).json({ error: 'Failed to respond to reschedule' });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
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
          eq(appointments.patientId, userId)
        )
      );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    const [updated] = await db
      .update(appointments)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    await db.insert(notifications).values({
      userId: appointment.doctorId,
      clinicId: appointment.clinicId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Patient has cancelled the appointment.`,
      data: { appointmentId: id },
    });

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

export const searchClinicsByLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radius = parseFloat(radiusKm as string) || 25;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const haversineExpr = sql`(6371 * acos(cos(radians(${latitude})) * cos(radians(COALESCE(${clinics.latitude}, 0))) * cos(radians(COALESCE(${clinics.longitude}, 0)) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(COALESCE(${clinics.latitude}, 0)))))`;

    const nearbyClinics = await db
      .select({
        id: clinics.id,
        name: clinics.name,
        address: clinics.address,
        city: clinics.city,
        state: clinics.state,
        zipCode: clinics.zipCode,
        latitude: clinics.latitude,
        longitude: clinics.longitude,
        distance: sql<number>`${haversineExpr}`,
      })
      .from(clinics)
      .where(
        and(
          eq(clinics.isActive, true),
          sql`${clinics.latitude} IS NOT NULL`,
          sql`${clinics.longitude} IS NOT NULL`,
          sql`${haversineExpr} <= ${radius}`
        )
      )
      .orderBy(sql`${haversineExpr}`);

    res.json({ clinics: nearbyClinics });
  } catch (error) {
    console.error('Error searching clinics by location:', error);
    res.status(500).json({ error: 'Failed to search clinics by location' });
  }
};

export const searchDoctorsByLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm, specialization } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radius = parseFloat(radiusKm as string) || 25;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const haversineExpr = sql`(6371 * acos(cos(radians(${latitude})) * cos(radians(COALESCE(${clinics.latitude}, 0))) * cos(radians(COALESCE(${clinics.longitude}, 0)) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(COALESCE(${clinics.latitude}, 0)))))`;

    let query = db
      .select({
        id: users.id,
        profileData: users.profileData,
        clinicId: clinicDoctors.clinicId,
        clinicName: clinics.name,
        clinicAddress: clinics.address,
        clinicCity: clinics.city,
        distance: sql<number>`${haversineExpr}`,
      })
      .from(users)
      .innerJoin(clinicDoctors, eq(users.id, clinicDoctors.doctorId))
      .innerJoin(clinics, eq(clinicDoctors.clinicId, clinics.id))
      .where(
        and(
          eq(users.role, 'doctor'),
          eq(clinicDoctors.isActive, true),
          eq(clinics.isActive, true),
          sql`${clinics.latitude} IS NOT NULL`,
          sql`${clinics.longitude} IS NOT NULL`,
          sql`${haversineExpr} <= ${radius}`
        )
      )
      .orderBy(sql`${haversineExpr}`);

    const doctors = await query;

    // Filter by specialization in memory (since it's in JSONB)
    const filtered = specialization
      ? doctors.filter((d) => {
          const profile = d.profileData as Record<string, unknown> | null;
          return profile?.specialization
            ?.toString()
            .toLowerCase()
            .includes((specialization as string).toLowerCase());
        })
      : doctors;

    res.json({ doctors: filtered });
  } catch (error) {
    console.error('Error searching doctors by location:', error);
    res.status(500).json({ error: 'Failed to search doctors by location' });
  }
};
