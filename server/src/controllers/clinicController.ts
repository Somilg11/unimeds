import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { appointments, users, clinics, records, clinicDoctors, auditLogs, notifications } from '../db/schema.js';
import { eq, desc, and, gte, lte, count, sql, inArray } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

async function getClinicIdFromUser(userId: string): Promise<string | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;
  const profileData = user.profileData as { clinicId?: string } | null;
  const clinicId = profileData?.clinicId ?? null;

  if (!clinicId) return null;

  // Verify the clinic is active
  const [clinic] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  if (!clinic || !clinic.isActive) return null;

  return clinicId;
}

export const getClinicAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const clinicAppointments = await db
      .select({
        id: appointments.id,
        slotTime: appointments.slotTime,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        patientName: sql<string>`(${users.profileData})::json->>'name'`,
        doctorName: sql<string>`(${users.profileData})::json->>'name'`,
        patientEmail: sql<string>`(${users.profileData})::json->>'email'`,
        doctorSpecialization: sql<string>`(${users.profileData})::json->>'specialization'`,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(eq(appointments.clinicId, clinicId))
      .orderBy(desc(appointments.slotTime));

    const doctorNames = await db
      .select({
        doctorId: appointments.doctorId,
        doctorName: sql<string>`(${users.profileData})::json->>'name'`,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .where(eq(appointments.clinicId, clinicId))
      .groupBy(appointments.doctorId, users.id);

    const doctorMap = new Map(doctorNames.map((d) => [d.doctorId, d.doctorName]));

    const enrichedAppointments = clinicAppointments.map((a) => ({
      ...a,
      doctorName: doctorMap.get(a.doctorId) ?? 'Unknown Doctor',
    }));

    res.json({ appointments: enrichedAppointments });
  } catch (error) {
    console.error('Error fetching clinic appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getClinicAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.slotTime, startOfDay),
          lte(appointments.slotTime, endOfDay)
        )
      );

    const [weekAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.slotTime, weekAgo)
        )
      );

    const [cancelledAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.status, 'cancelled')
        )
      );

    const [totalAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(eq(appointments.clinicId, clinicId));

    const noShowRate = (totalAppointments?.count || 0) > 0
      ? ((cancelledAppointments?.count || 0) / (totalAppointments?.count || 0)) * 100
      : 0;

    const monthlyTrend: Array<{ month: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const [monthCount] = await db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.clinicId, clinicId),
            gte(appointments.slotTime, startOfMonth),
            lte(appointments.slotTime, endOfMonth)
          )
        );

      monthlyTrend.push({
        month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        count: monthCount?.count || 0,
      });
    }

    const doctorPerformance = await db
      .select({
        doctorId: appointments.doctorId,
        doctorName: sql<string>`(${users.profileData})::json->>'name'`,
        specialization: sql<string>`(${users.profileData})::json->>'specialization'`,
        totalAppointments: count(),
        confirmedCount: sql<number>`count(*) filter (where ${appointments.status} = 'confirmed')`,
        cancelledCount: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')`,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .where(eq(appointments.clinicId, clinicId))
      .groupBy(appointments.doctorId, users.id);

    const [patientCount] = await db
      .select({ count: sql<number>`count(distinct ${appointments.patientId})` })
      .from(appointments)
      .where(eq(appointments.clinicId, clinicId));

    const [doctorCount] = await db
      .select({ count: count() })
      .from(clinicDoctors)
      .where(and(eq(clinicDoctors.clinicId, clinicId), eq(clinicDoctors.isActive, true)));

    const upcomingAppointments = await db
      .select({
        id: appointments.id,
        slotTime: appointments.slotTime,
        status: appointments.status,
        patientId: appointments.patientId,
        patientName: sql<string>`(${users.profileData})::json->>'name'`,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.slotTime, startOfDay)
        )
      )
      .orderBy(appointments.slotTime)
      .limit(10);

    res.json({
      analytics: {
        todayAppointments: todayAppointments?.count || 0,
        weekAppointments: weekAppointments?.count || 0,
        noShowRate: noShowRate.toFixed(2),
        totalAppointments: totalAppointments?.count || 0,
        totalPatients: patientCount?.count || 0,
        totalDoctors: doctorCount?.count || 0,
        monthlyTrend,
        doctorPerformance,
      },
      upcomingAppointments,
    });
  } catch (error) {
    console.error('Error fetching clinic analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

export const updateClinicSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const { settings, n8nWebhookUrls, address, city, state, zipCode, latitude, longitude } = req.body;

    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if (settings) updatePayload.settings = settings;
    if (n8nWebhookUrls) updatePayload.n8nWebhookUrls = n8nWebhookUrls;
    if (address !== undefined) updatePayload.address = address || null;
    if (city !== undefined) updatePayload.city = city || null;
    if (state !== undefined) updatePayload.state = state || null;
    if (zipCode !== undefined) updatePayload.zipCode = zipCode || null;
    if (latitude !== undefined) updatePayload.latitude = latitude != null ? Number(latitude) : null;
    if (longitude !== undefined) updatePayload.longitude = longitude != null ? Number(longitude) : null;

    const [updatedClinic] = await db
      .update(clinics)
      .set(updatePayload)
      .where(eq(clinics.id, clinicId))
      .returning();

    await db.insert(auditLogs).values({
      userId,
      action: 'CLINIC_SETTINGS_UPDATED',
      targetResource: `clinics:${clinicId}`,
      metadata: {
        changes: updatePayload,
      },
    });

    res.json({ success: true, clinic: updatedClinic });
  } catch (error) {
    console.error('Error updating clinic settings:', error);
    res.status(500).json({ error: 'Failed to update clinic settings' });
  }
};

export const getClinicDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const appointmentStats = await db
      .select({
        patientCount: count(sql`distinct(${appointments.patientId})`),
        appointmentCount: count()
      })
      .from(appointments)
      .where(eq(appointments.clinicId, clinicId));

    const [doctorCountResult] = await db
      .select({ count: count() })
      .from(clinicDoctors)
      .where(and(eq(clinicDoctors.clinicId, clinicId), eq(clinicDoctors.isActive, true)));

    const [recordResult] = await db
      .select({ count: count() })
      .from(records)
      .innerJoin(appointments, eq(records.patientId, appointments.patientId))
      .where(eq(appointments.clinicId, clinicId));

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [todayAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.slotTime, startOfDay),
          lte(appointments.slotTime, endOfDay)
        )
      );

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [weekAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.slotTime, weekAgo)
        )
      );

    res.json({
      metrics: {
        totalPatients: appointmentStats[0]?.patientCount || 0,
        totalDoctors: doctorCountResult?.count || 0,
        totalAppointments: appointmentStats[0]?.appointmentCount || 0,
        totalRecords: recordResult?.count || 0,
        todayAppointments: todayAppointments?.count || 0,
        weekAppointments: weekAppointments?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching clinic dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};

export const getClinicStaff = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const staff = await db
      .select({
        id: clinicDoctors.id,
        doctorId: clinicDoctors.doctorId,
        isActive: clinicDoctors.isActive,
        joinedAt: clinicDoctors.joinedAt,
        invitedBy: clinicDoctors.invitedBy,
        authId: users.authId,
        name: sql<string>`(${users.profileData})::json->>'name'`,
        email: sql<string>`(${users.profileData})::json->>'email'`,
        phone: sql<string>`(${users.profileData})::json->>'phone'`,
        specialization: sql<string>`(${users.profileData})::json->>'specialization'`,
        licenseNumber: sql<string>`(${users.profileData})::json->>'licenseNumber'`,
      })
      .from(clinicDoctors)
      .innerJoin(users, eq(clinicDoctors.doctorId, users.id))
      .where(eq(clinicDoctors.clinicId, clinicId))
      .orderBy(desc(clinicDoctors.joinedAt));

    res.json({ staff });
  } catch (error) {
    console.error('Error fetching clinic staff:', error);
    res.status(500).json({ error: 'Failed to fetch clinic staff' });
  }
};

export const addDoctorToClinic = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const { email, name, specialization, licenseNumber, phone } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(
        eq(sql`(${users.profileData})::json->>'email'`, email)
      )
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const authId = randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(randomBytes(8).toString('hex'), 10);

    // Fetch clinic address to inherit into doctor's profile
    const [clinicRecord] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    const doctorProfileData: {
      name: string;
      email: string;
      phone?: string;
      specialization?: string;
      licenseNumber?: string;
      address?: string;
    } = {
      name,
      email,
    };
    if (phone) doctorProfileData.phone = phone;
    if (specialization) doctorProfileData.specialization = specialization;
    if (licenseNumber) doctorProfileData.licenseNumber = licenseNumber;
    if (clinicRecord?.address) doctorProfileData.address = clinicRecord.address;

    const [newUser] = await db
      .insert(users)
      .values({
        authId,
        role: 'doctor',
        profileData: doctorProfileData,
      })
      .returning();

    if (!newUser) {
      return res.status(500).json({ error: 'Failed to create doctor user' });
    }

    const [clinicDoctor] = await db
      .insert(clinicDoctors)
      .values({
        clinicId,
        doctorId: newUser.id,
        isActive: true,
        invitedBy: userId,
      })
      .returning();

    if (!clinicDoctor) {
      return res.status(500).json({ error: 'Failed to create clinic-doctor link' });
    }

    await db.insert(notifications).values({
      userId: newUser.id,
      clinicId,
      type: 'general',
      title: 'You have been added to a clinic',
      message: `You have been added to a clinic as a doctor. Your login identifier is: ${authId}`,
      data: { clinicId, addedBy: userId },
    });

    await db.insert(auditLogs).values({
      userId,
      action: 'DOCTOR_ADDED_TO_CLINIC',
      targetResource: `clinicDoctors:${clinicDoctor.id}`,
      metadata: {
        newState: { clinicId, doctorId: newUser.id, name, email },
      },
    });

    res.status(201).json({
      success: true,
      doctor: {
        id: newUser.id,
        authId,
        name,
        email,
        specialization,
        licenseNumber,
        phone,
      },
      clinicDoctor,
    });
  } catch (error) {
    console.error('Error adding doctor to clinic:', error);
    res.status(500).json({ error: 'Failed to add doctor to clinic' });
  }
};

export const removeDoctorFromClinic = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId is required' });
    }

    const existingLink = await db
      .select()
      .from(clinicDoctors)
      .where(
        and(
          eq(clinicDoctors.clinicId, clinicId),
          eq(clinicDoctors.doctorId, doctorId)
        )
      )
      .limit(1);

    if (existingLink.length === 0) {
      return res.status(404).json({ error: 'Doctor not found in this clinic' });
    }

    const [activeAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.doctorId, doctorId),
          inArray(appointments.status, ['pending', 'confirmed'])
        )
      );

    if ((activeAppointments?.count || 0) > 0) {
      await db
        .update(clinicDoctors)
        .set({ isActive: false })
        .where(
          and(
            eq(clinicDoctors.clinicId, clinicId),
            eq(clinicDoctors.doctorId, doctorId)
          )
        );

      await db.insert(auditLogs).values({
        userId,
        action: 'DOCTOR_DEACTIVATED_FROM_CLINIC',
        targetResource: `clinicDoctors:${existingLink[0]?.id}`,
        metadata: {
          previousState: { clinicId, doctorId, reason: 'active_appointments' },
        },
      });

      res.json({
        success: true,
        message: 'Doctor deactivated due to existing active appointments',
        deactivated: true,
      });
    } else {
      await db
        .delete(clinicDoctors)
        .where(
          and(
            eq(clinicDoctors.clinicId, clinicId),
            eq(clinicDoctors.doctorId, doctorId)
          )
        );

      await db.insert(auditLogs).values({
        userId,
        action: 'DOCTOR_REMOVED_FROM_CLINIC',
        targetResource: `clinicDoctors:${existingLink[0]?.id}`,
        metadata: {
          previousState: { clinicId, doctorId },
        },
      });

      res.json({
        success: true,
        message: 'Doctor removed from clinic',
        deactivated: false,
      });
    }
  } catch (error) {
    console.error('Error removing doctor from clinic:', error);
    res.status(500).json({ error: 'Failed to remove doctor from clinic' });
  }
};

export const toggleDoctorActive = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const { doctorId, isActive } = req.body;
    if (!doctorId || typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'doctorId and isActive (boolean) are required' });
    }

    const [updated] = await db
      .update(clinicDoctors)
      .set({ isActive })
      .where(
        and(
          eq(clinicDoctors.clinicId, clinicId),
          eq(clinicDoctors.doctorId, doctorId)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Doctor not found in this clinic' });
    }

    await db.insert(auditLogs).values({
      userId,
      action: isActive ? 'DOCTOR_ACTIVATED_IN_CLINIC' : 'DOCTOR_DEACTIVATED_IN_CLINIC',
      targetResource: `clinicDoctors:${updated.id}`,
      metadata: {
        changes: { clinicId, doctorId, isActive },
      },
    });

    res.json({ success: true, clinicDoctor: updated });
  } catch (error) {
    console.error('Error toggling doctor active status:', error);
    res.status(500).json({ error: 'Failed to toggle doctor status' });
  }
};

export const getClinicPatients = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const patients = await db
      .select({
        patientId: appointments.patientId,
        name: sql<string>`(${users.profileData})::json->>'name'`,
        email: sql<string>`(${users.profileData})::json->>'email'`,
        phone: sql<string>`(${users.profileData})::json->>'phone'`,
        dateOfBirth: sql<string>`(${users.profileData})::json->>'dateOfBirth'`,
        gender: sql<string>`(${users.profileData})::json->>'gender'`,
        lastAppointment: sql<Date>`max(${appointments.slotTime})`,
        totalAppointments: count(),
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(eq(appointments.clinicId, clinicId))
      .groupBy(appointments.patientId, users.id)
      .orderBy(desc(sql`max(${appointments.slotTime})`));

    res.json({ patients });
  } catch (error) {
    console.error('Error fetching clinic patients:', error);
    res.status(500).json({ error: 'Failed to fetch clinic patients' });
  }
};

export const getClinicRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const clinicRecords = await db
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
        patientEmail: sql<string>`(${users.profileData})::json->>'email'`,
        appointmentId: appointments.id,
        appointmentSlotTime: appointments.slotTime,
      })
      .from(records)
      .innerJoin(appointments, eq(records.patientId, appointments.patientId))
      .innerJoin(users, eq(records.patientId, users.id))
      .where(eq(appointments.clinicId, clinicId))
      .groupBy(records.id, users.id, appointments.id)
      .orderBy(desc(records.createdAt));

    res.json({ records: clinicRecords });
  } catch (error) {
    console.error('Error fetching clinic records:', error);
    res.status(500).json({ error: 'Failed to fetch clinic records' });
  }
};

export const getClinicById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clinicId = await getClinicIdFromUser(userId);
    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic associated with this account' });
    }

    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    res.json({ clinic });
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ error: 'Failed to fetch clinic' });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { unreadOnly } = req.query;

    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly === 'true') {
      conditions.push(eq(notifications.isRead, false));
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
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
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(eq(notifications.userId, userId));
      return res.json({ success: true });
    }

    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' });
    }

    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
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
