import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { appointments, users, clinics } from '../db/schema.js';
import { eq, desc, and, gte, lte, count } from 'drizzle-orm';

export const getClinicAppointments = async (req: Request, res: Response) => {
  try {
    const clinicId = req.user?.id; // Assuming clinic admin's user ID is the clinic ID for now

    if (!clinicId) {
      return res.status(401).json({ error: 'Clinic not authenticated' });
    }

    const clinicAppointments = await db
      .select({
        id: appointments.id,
        slotTime: appointments.slotTime,
        status: appointments.status,
        patientName: users.profileData,
        doctorName: users.profileData,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(eq(appointments.clinicId, clinicId))
      .orderBy(desc(appointments.slotTime));

    res.json({ appointments: clinicAppointments });
  } catch (error) {
    console.error('Error fetching clinic appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getClinicAnalytics = async (req: Request, res: Response) => {
  try {
    const clinicId = req.user?.id;

    if (!clinicId) {
      return res.status(401).json({ error: 'Clinic not authenticated' });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get this week's date range
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Total appointments today
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

    // Total appointments this week
    const [weekAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.slotTime, weekAgo)
        )
      );

    // No-show rate (cancelled appointments)
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

    // Upcoming appointments
    const upcomingAppointments = await db
      .select({
        id: appointments.id,
        slotTime: appointments.slotTime,
        status: appointments.status,
        patientName: users.profileData,
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
    const { settings, n8nWebhookUrls } = req.body;
    const clinicId = req.user?.id;

    if (!clinicId) {
      return res.status(401).json({ error: 'Clinic not authenticated' });
    }

    const [updatedClinic] = await db
      .update(clinics)
      .set({
        settings,
        n8nWebhookUrls,
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, clinicId))
      .returning();

    res.json({ success: true, clinic: updatedClinic });
  } catch (error) {
    console.error('Error updating clinic settings:', error);
    res.status(500).json({ error: 'Failed to update clinic settings' });
  }
};
