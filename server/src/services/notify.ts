import { and, eq } from 'drizzle-orm';
import { db, type DbOrTx } from '../db/db.js';
import { notifications, clinicMembers, type Notification } from '../db/schema.js';

type NotificationInput = {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  clinicId?: string | null;
  link?: string | null;
  data?: Record<string, unknown>;
};

export async function notify(input: NotificationInput | NotificationInput[], conn: DbOrTx = db) {
  const rows = Array.isArray(input) ? input : [input];
  if (rows.length === 0) return;
  await conn.insert(notifications).values(
    rows.map((r) => ({
      userId: r.userId,
      type: r.type,
      title: r.title,
      message: r.message,
      clinicId: r.clinicId ?? null,
      link: r.link ?? null,
      data: r.data ?? null,
    }))
  );
}

export async function clinicAdminIds(clinicId: string, conn: DbOrTx = db): Promise<string[]> {
  const rows = await conn
    .select({ userId: clinicMembers.userId })
    .from(clinicMembers)
    .where(and(eq(clinicMembers.clinicId, clinicId), eq(clinicMembers.role, 'clinic_admin'), eq(clinicMembers.isActive, true)));
  return rows.map((r) => r.userId);
}

export async function notifyClinicAdmins(
  clinicId: string,
  n: Omit<NotificationInput, 'userId' | 'clinicId'>,
  conn: DbOrTx = db
) {
  const ids = await clinicAdminIds(clinicId, conn);
  await notify(
    ids.map((userId) => ({ ...n, userId, clinicId })),
    conn
  );
}
