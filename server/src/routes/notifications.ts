import { Router } from 'express';
import { z } from 'zod';
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db/db.js';
import { notifications } from '../db/schema.js';
import { authenticate, authUser } from '../middleware/auth.js';
import { pageParams, paged } from '../lib/http.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const me = authUser(req);
  const { unread } = z.object({ unread: z.enum(['true', 'false']).optional() }).parse(req.query);
  const { page, pageSize, limit, offset } = pageParams(req.query);
  const where = and(eq(notifications.userId, me.id), unread === 'true' ? isNull(notifications.readAt) : undefined);
  const rows = await db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset);
  const [total] = await db.select({ n: count() }).from(notifications).where(where);
  const [unreadCount] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));
  res.json({ ...paged(rows, total?.n ?? 0, page, pageSize), unreadCount: unreadCount?.n ?? 0 });
});

router.post('/read', async (req, res) => {
  const me = authUser(req);
  const body = z.union([z.object({ all: z.literal(true) }), z.object({ ids: z.array(z.string().uuid()).min(1).max(100) })]).parse(req.body);
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, me.id), isNull(notifications.readAt), 'ids' in body ? inArray(notifications.id, body.ids) : undefined)
    );
  res.json({ ok: true });
});

export default router;
