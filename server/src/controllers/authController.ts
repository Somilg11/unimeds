import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users, clinics, auditLogs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export const oauthLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, picture } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Look up user by authId = email (clinic_admin) or by profileData email (patient/doctor)
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.authId, email))
      .limit(1);

    // If not found by authId, search by profileData email
    if (!user) {
      const allUsers = await db.select().from(users);
      user = allUsers.find((u) => {
        const profile = u.profileData as Record<string, unknown> | null;
        return profile?.email === email;
      }) || null;
    }

    // If still not found, create as patient
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          authId: email,
          role: 'patient',
          profileData: {
            name: name || '',
            email,
            picture: picture || '',
          },
        })
        .returning();
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to find or create user' });
    }

    // Check if clinic_admin user is linked to an active clinic
    if (user.role === 'clinic_admin') {
      const profile = user.profileData as Record<string, unknown> | null;
      const clinicId = profile?.clinicId as string | undefined;

      if (clinicId) {
        const [clinic] = await db
          .select()
          .from(clinics)
          .where(eq(clinics.id, clinicId))
          .limit(1);

        if (!clinic || !clinic.isActive) {
          return res.status(403).json({ error: 'Clinic account is not active. Please activate your clinic first.' });
        }
      }
    }

    // Sign a JWT that the backend authenticate middleware can verify
    const token = jwt.sign(
      { sub: user.authId, authId: user.authId },
      process.env.AUTH_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: (user.profileData as Record<string, unknown>)?.name || name || '',
        email: (user.profileData as Record<string, unknown>)?.email || email,
        role: user.role,
      },
    });

    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'OAUTH_LOGIN',
      targetResource: `users:${user.id}`,
      metadata: {
        newState: { email, role: user.role },
      },
    });
  } catch (error) {
    console.error('Error during OAuth login:', error);
    res.status(500).json({ error: 'OAuth login failed' });
  }
};
