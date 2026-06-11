import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import {
  clinics,
  auditLogs,
  users,
  appointments,
  records,
  clinicDoctors,
  notifications,
} from '../db/schema.js';
import { eq, desc, count, and, gte, lte, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

// Super admin hardcoded credentials
const SUPER_ADMIN_USERNAME = 'admin123';
const SUPER_ADMIN_PASSWORD = '12345678';

export const superAdminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username !== SUPER_ADMIN_USERNAME || password !== SUPER_ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find or create super admin user
    let [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'super_admin'))
      .limit(1);

    if (!adminUser) {
      const authId = `admin-${randomBytes(16).toString('hex')}`;
      [adminUser] = await db
        .insert(users)
        .values({
          authId,
          role: 'super_admin',
          profileData: {
            name: 'Super Admin',
            email: 'admin@unimeds.com',
          },
        })
        .returning();
    }

    const token = jwt.sign(
      { sub: adminUser.authId, authId: adminUser.authId },
      process.env.AUTH_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: adminUser.id,
        name: (adminUser.profileData as Record<string, unknown>)?.name || 'Super Admin',
        email: (adminUser.profileData as Record<string, unknown>)?.email || '',
        role: adminUser.role,
      },
    });

    await db.insert(auditLogs).values({
      userId: adminUser.id,
      action: 'SUPER_ADMIN_LOGIN',
      targetResource: `users:${adminUser.id}`,
      metadata: {
        newState: { authId: adminUser.authId },
      },
    });
  } catch (error) {
    console.error('Error during super admin login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const createClinic = async (req: Request, res: Response) => {
  try {
    const { name, email, n8nWebhookUrls, settings } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Clinic name and email are required' });
    }

    // Check if email is already used by another clinic
    const [existingClinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.email, email))
      .limit(1);

    if (existingClinic) {
      return res.status(409).json({ error: 'A clinic with this email already exists' });
    }

    const activationToken = randomBytes(32).toString('hex');

    const [newClinic] = await db
      .insert(clinics)
      .values({
        name,
        email,
        isActive: false,
        activationToken,
        n8nWebhookUrls,
        settings,
      })
      .returning();

    if (!newClinic) {
      return res.status(500).json({ error: 'Failed to create clinic' });
    }

    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user?.id || null,
      action: 'TENANT_ONBOARDED',
      targetResource: `clinics:${newClinic.id}`,
      metadata: {
        newState: { clinicName: name, email },
      },
    });

    // Generate the activation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const activationLink = `${baseUrl}/clinic/activate?token=${activationToken}`;

    res.json({
      success: true,
      clinic: newClinic,
      activationLink,
      message: `Invitation email would be sent to ${email}. Activation link: ${activationLink}`,
    });
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

    const [doctorCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'doctor'));

    const [patientCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'patient'));

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
        totalDoctors: doctorCount?.count || 0,
        totalPatients: patientCount?.count || 0,
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
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: sql<string>`(${users.profileData})::json->>'name'`,
        userEmail: sql<string>`(${users.profileData})::json->>'email'`,
        action: auditLogs.action,
        targetResource: auditLogs.targetResource,
        metadata: auditLogs.metadata,
        timestamp: auditLogs.timestamp,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
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
    const allClinics = await db
      .select({
        id: clinics.id,
        name: clinics.name,
        email: clinics.email,
        isActive: clinics.isActive,
        activatedAt: clinics.activatedAt,
        n8nWebhookUrls: clinics.n8nWebhookUrls,
        settings: clinics.settings,
        createdAt: clinics.createdAt,
        updatedAt: clinics.updatedAt,
        doctorCount: count(clinicDoctors.id),
      })
      .from(clinics)
      .leftJoin(clinicDoctors, eq(clinics.id, clinicDoctors.clinicId))
      .groupBy(clinics.id)
      .orderBy(desc(clinics.createdAt));

    res.json({ clinics: allClinics });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
};

export const getClinicDoctors = async (req: Request, res: Response) => {
  try {
    const clinicId = String(req.params.clinicId);

    if (!clinicId) {
      return res.status(400).json({ error: 'clinicId is required' });
    }

    const doctors = await db
      .select({
        id: clinicDoctors.id,
        clinicId: clinicDoctors.clinicId,
        doctorId: clinicDoctors.doctorId,
        isActive: clinicDoctors.isActive,
        joinedAt: clinicDoctors.joinedAt,
        invitedBy: clinicDoctors.invitedBy,
        doctorProfile: users.profileData,
        doctorCreatedAt: users.createdAt,
      })
      .from(clinicDoctors)
      .innerJoin(users, eq(clinicDoctors.doctorId, users.id))
      .where(eq(clinicDoctors.clinicId, clinicId));

    res.json({ doctors });
  } catch (error) {
    console.error('Error fetching clinic doctors:', error);
    res.status(500).json({ error: 'Failed to fetch clinic doctors' });
  }
};

export const assignDoctorToClinic = async (req: Request, res: Response) => {
  try {
    const { clinicId, doctorId } = req.body;

    if (!clinicId || !doctorId) {
      return res.status(400).json({ error: 'clinicId and doctorId are required' });
    }

    const existingAssignment = await db
      .select()
      .from(clinicDoctors)
      .where(
        and(
          eq(clinicDoctors.clinicId, clinicId),
          eq(clinicDoctors.doctorId, doctorId),
          eq(clinicDoctors.isActive, true)
        )
      );

    if (existingAssignment.length > 0) {
      return res.status(409).json({ error: 'Doctor is already assigned to this clinic' });
    }

    const [assignment] = await db
      .insert(clinicDoctors)
      .values({
        clinicId,
        doctorId,
        isActive: true,
        invitedBy: req.user?.id || null,
      })
      .returning();

    if (!assignment) {
      return res.status(500).json({ error: 'Failed to assign doctor to clinic' });
    }

    const clinicAdmins = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'clinic_admin'),
        )
      );

    const clinicAdminIds = clinicAdmins
      .filter((admin) => {
        const profile = admin.profileData as Record<string, unknown> | null;
        return profile?.clinicId === clinicId;
      })
      .map((admin) => admin.id);

    if (clinicAdminIds.length > 0) {
      const doctorUser = await db
        .select()
        .from(users)
        .where(eq(users.id, doctorId))
        .limit(1);

      const doctorProfile = doctorUser[0]?.profileData as Record<string, unknown> | null;
      const doctorName = doctorProfile?.name || 'A doctor';

      const clinicDetails = await db
        .select()
        .from(clinics)
        .where(eq(clinics.id, clinicId))
        .limit(1);

      const clinicName = clinicDetails[0]?.name || 'the clinic';

      for (const adminId of clinicAdminIds) {
        await db.insert(notifications).values({
          userId: adminId,
          clinicId: clinicId,
          type: 'general',
          title: 'Doctor Assigned to Clinic',
          message: `${doctorName} has been assigned to ${clinicName}.`,
          data: {
            doctorId,
            clinicId,
            action: 'doctor_assigned',
          },
        });
      }
    }

    await db.insert(auditLogs).values({
      userId: req.user?.id || null,
      action: 'DOCTOR_ASSIGNED_TO_CLINIC',
      targetResource: `clinicDoctors:${assignment.id}`,
      metadata: {
        newState: { clinicId, doctorId },
      },
    });

    res.json({ success: true, assignment });
  } catch (error) {
    console.error('Error assigning doctor to clinic:', error);
    res.status(500).json({ error: 'Failed to assign doctor to clinic' });
  }
};

export const removeDoctorFromClinic = async (req: Request, res: Response) => {
  try {
    const { clinicId, doctorId } = req.body;

    if (!clinicId || !doctorId) {
      return res.status(400).json({ error: 'clinicId and doctorId are required' });
    }

    const existingAssignment = await db
      .select()
      .from(clinicDoctors)
      .where(
        and(
          eq(clinicDoctors.clinicId, clinicId),
          eq(clinicDoctors.doctorId, doctorId),
          eq(clinicDoctors.isActive, true)
        )
      );

    if (existingAssignment.length === 0) {
      return res.status(404).json({ error: 'Doctor is not assigned to this clinic' });
    }

    const assignmentId = existingAssignment[0]!.id;

    await db
      .delete(clinicDoctors)
      .where(
        and(
          eq(clinicDoctors.clinicId, clinicId),
          eq(clinicDoctors.doctorId, doctorId)
        )
      );

    await db.insert(auditLogs).values({
      userId: req.user?.id || null,
      action: 'DOCTOR_REMOVED_FROM_CLINIC',
      targetResource: `clinicDoctors:${assignmentId}`,
      metadata: {
        previousState: { clinicId, doctorId },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing doctor from clinic:', error);
    res.status(500).json({ error: 'Failed to remove doctor from clinic' });
  }
};

export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: users.id,
        authId: users.authId,
        role: users.role,
        profileData: users.profileData,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        assignedClinicCount: count(clinicDoctors.id),
      })
      .from(users)
      .leftJoin(clinicDoctors, eq(users.id, clinicDoctors.doctorId))
      .where(eq(users.role, 'doctor'))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    // Fetch all clinic assignments for these doctors in one query
    const doctorIds = rows.map((r) => r.id);
    const assignments = doctorIds.length > 0
      ? await db
          .select({
            doctorId: clinicDoctors.doctorId,
            clinicId: clinicDoctors.clinicId,
            clinicName: clinics.name,
            isActive: clinicDoctors.isActive,
          })
          .from(clinicDoctors)
          .innerJoin(clinics, eq(clinicDoctors.clinicId, clinics.id))
          .where(sql`${clinicDoctors.doctorId} IN ${doctorIds}`)
      : [];

    const assignmentsByDoctor = new Map<string, typeof assignments>();
    for (const a of assignments) {
      if (!assignmentsByDoctor.has(a.doctorId)) {
        assignmentsByDoctor.set(a.doctorId, []);
      }
      assignmentsByDoctor.get(a.doctorId)!.push(a);
    }

    const doctors = rows.map((row) => {
      const profile = (row.profileData as Record<string, unknown>) || {};
      const doctorAssignments = assignmentsByDoctor.get(row.id) || [];
      return {
        doctorId: row.id,
        id: row.id,
        authId: row.authId,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        specialization: profile.specialization || '',
        licenseNumber: profile.licenseNumber || '',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isActive: true,
        assignedClinicCount: row.assignedClinicCount,
        assignedClinics: doctorAssignments.map((a) => ({
          clinicId: a.clinicId,
          clinicName: a.clinicName,
          isActive: a.isActive,
        })),
      };
    });

    res.json({ doctors, total: doctors.length });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, specialization, licenseNumber } = req.body;

    if (!name || !email || !phone || !specialization || !licenseNumber) {
      return res.status(400).json({ error: 'All fields are required: name, email, phone, specialization, licenseNumber' });
    }

    const authId = `dr-${randomBytes(16).toString('hex')}`;

    const [newDoctor] = await db
      .insert(users)
      .values({
        authId,
        role: 'doctor',
        profileData: {
          name,
          email,
          phone,
          specialization,
          licenseNumber,
        },
      })
      .returning();

    if (!newDoctor) {
      return res.status(500).json({ error: 'Failed to create doctor' });
    }

    await db.insert(auditLogs).values({
      userId: req.user?.id || null,
      action: 'DOCTOR_CREATED',
      targetResource: `users:${newDoctor.id}`,
      metadata: {
        newState: { name, email, specialization, authId },
      },
    });

    res.json({ success: true, doctor: { ...newDoctor, authId } });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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

    const [unreadCountResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    res.json({
      notifications: userNotifications,
      unreadCount: unreadCountResult?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = String(req.params.id);

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const existingNotification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      )
      .limit(1);

    if (existingNotification.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (existingNotification[0]!.isRead) {
      return res.json({ success: true, notification: existingNotification[0] });
    }

    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();

    res.json({ success: true, notification: updatedNotification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const toggleClinicStatus = async (req: Request, res: Response) => {
  try {
    const { clinicId } = req.params;

    if (!clinicId) {
      return res.status(400).json({ error: 'clinicId is required' });
    }

    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const newIsActive = !clinic.isActive;

    const [updated] = await db
      .update(clinics)
      .set({
        isActive: newIsActive,
        activatedAt: newIsActive ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, clinicId))
      .returning();

    await db.insert(auditLogs).values({
      userId: req.user?.id || null,
      action: newIsActive ? 'CLINIC_ACTIVATED' : 'CLINIC_DEACTIVATED',
      targetResource: `clinics:${clinicId}`,
      metadata: {
        changes: { isActive: newIsActive },
      },
    });

    res.json({ success: true, clinic: updated });
  } catch (error) {
    console.error('Error toggling clinic status:', error);
    res.status(500).json({ error: 'Failed to toggle clinic status' });
  }
};

// Public endpoint - no auth required
export const getClinicByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Activation token is required' });
    }

    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.activationToken, token))
      .limit(1);

    if (!clinic) {
      return res.status(404).json({ error: 'Invalid or expired activation link' });
    }

    res.json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
        email: clinic.email,
        isActive: clinic.isActive,
        activatedAt: clinic.activatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching clinic by token:', error);
    res.status(500).json({ error: 'Failed to fetch clinic' });
  }
};

// Public endpoint - no auth required
export const activateClinic = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Activation token is required' });
    }

    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.activationToken, token))
      .limit(1);

    if (!clinic) {
      return res.status(404).json({ error: 'Invalid or expired activation link' });
    }

    if (clinic.isActive) {
      return res.json({ success: true, message: 'Clinic is already activated', clinicId: clinic.id });
    }

    // Update clinic to active
    const [updatedClinic] = await db
      .update(clinics)
      .set({
        isActive: true,
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, clinic.id))
      .returning();

    // Create a clinic_admin user with the clinic's email as authId
    // This allows the user to login via Google OAuth with that email
    const authId = clinic.email || `clinic-${clinic.id}`;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authId))
      .limit(1);

    if (!existingUser) {
      await db.insert(users).values({
        authId,
        role: 'clinic_admin',
        profileData: {
          name: clinic.name,
          email: clinic.email || '',
          clinicId: clinic.id,
        },
      });
    }

    // Log the activation
    await db.insert(auditLogs).values({
      action: 'CLINIC_ACTIVATED',
      targetResource: `clinics:${clinic.id}`,
      metadata: {
        newState: { activatedAt: new Date().toISOString() },
      },
    });

    res.json({
      success: true,
      message: 'Clinic activated successfully. You can now login with your Google account.',
      clinicId: clinic.id,
    });
  } catch (error) {
    console.error('Error activating clinic:', error);
    res.status(500).json({ error: 'Failed to activate clinic' });
  }
};
