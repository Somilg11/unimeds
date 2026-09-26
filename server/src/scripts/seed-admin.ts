/**
 * Creates or updates the platform super admin from environment variables.
 *   SUPER_ADMIN_EMAIL=you@company.com SUPER_ADMIN_PASSWORD='…' npm run seed:admin
 */
import { eq } from 'drizzle-orm';
import { db, pool } from '../db/db.js';
import { users } from '../db/schema.js';
import { hashPassword, normalizeEmail } from '../lib/tokens.js';

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;
if (!email || !password || password.length < 12) {
  console.error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (min 12 characters).');
  process.exit(1);
}

const normalized = normalizeEmail(email);
const passwordHash = await hashPassword(password);
const [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);

if (existing) {
  await db
    .update(users)
    .set({ role: 'super_admin', passwordHash, isActive: true, tokenVersion: existing.tokenVersion + 1, updatedAt: new Date() })
    .where(eq(users.id, existing.id));
  console.log(`Updated ${normalized} as super admin.`);
} else {
  await db.insert(users).values({ email: normalized, name: 'Platform Admin', role: 'super_admin', passwordHash, emailVerifiedAt: new Date() });
  console.log(`Created super admin ${normalized}.`);
}
await pool.end();
