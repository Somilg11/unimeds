import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { clinics, auditLogs, users, appointments, records } from '../db/schema.js';
import { eq, desc, count, and, gte, lte } from 'drizzle-orm';

export const createClinic = async (req: Request, res: Response) => {
  try {
    const { name, n8nWebhookUrls, settings } = req.body;

    const [newClinic] = await db.insert(clinics).values({
      name,
      n8nWebhookUrls,
      settings,
    }).returning();

    if (!newClinic) {
      return res.status(500).json({ error: 'Failed to create clinic' });
    }

    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user?.id || null,
      action: 'TENANT_ONBOARDED',
      targetResource: `clinics:${newClinic.id}`,
      metadata: {
        newState: { clinicName: name },
      },
    });

    res.json({ success: true, clinic: newClinic });
  } catch (error) {
    console.error('Error creating clinic:', error);
    res.status(500).json({ error: 'Failed to create clinic' });
  }
};

export const getPlatformMetrics = async (req: Request, res: Response) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [clinicCount] = await db.select({ count: count() }).from(clinics);
    const [appointmentCount] = await db.select({ count: count() }).from(appointments);
    const [recordCount] = await db.select({ count: count() }).from(records);

    // Get appointments in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(gte(appointments.createdAt, thirtyDaysAgo));

    res.json({
      metrics: {
        totalUsers: userCount?.count || 0,
        totalClinics: clinicCount?.count || 0,
        totalAppointments: appointmentCount?.count || 0,
        totalRecords: recordCount?.count || 0,
        recentAppointments: recentAppointments?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching platform metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getClinics = async (req: Request, res: Response) => {
  try {
    const allClinics = await db.select().from(clinics).orderBy(desc(clinics.createdAt));
    res.json({ clinics: allClinics });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
};
