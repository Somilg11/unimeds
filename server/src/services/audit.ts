import type { Request } from 'express';
import { db, type DbOrTx } from '../db/db.js';
import { auditLogs } from '../db/schema.js';

type AuditEntry = {
  action: string;
  targetType: string;
  targetId?: string | null;
  clinicId?: string | null;
  metadata?: Record<string, unknown>;
  // For unauthenticated routes (login, invite accept) where req.user isn't set yet
  actor?: { id: string; role: string };
};

export async function audit(req: Request | null, entry: AuditEntry, conn: DbOrTx = db) {
  await conn.insert(auditLogs).values({
    actorId: entry.actor?.id ?? req?.user?.id ?? null,
    actorRole: entry.actor?.role ?? req?.user?.role ?? null,
    clinicId: entry.clinicId ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId ?? null,
    metadata: entry.metadata ?? null,
    ipAddress: req?.ip ?? null,
    userAgent: req?.get('user-agent')?.slice(0, 300) ?? null,
  });
}
