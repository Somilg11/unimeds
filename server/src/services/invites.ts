import { and, eq, isNull } from 'drizzle-orm';
import { db, type DbOrTx } from '../db/db.js';
import { authTokens, type UserRole } from '../db/schema.js';
import { createOneTimeToken, normalizeEmail } from '../lib/tokens.js';
import { env } from '../lib/env.js';
import { sendMail } from './mailer.js';

export const INVITE_TTL_DAYS = 7;
export const RESET_TTL_MINUTES = 60;

const ROLE_LABEL: Record<UserRole, string> = {
  patient: 'patient',
  doctor: 'doctor',
  clinic_admin: 'clinic administrator',
  super_admin: 'platform administrator',
};

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

type InviteInput = {
  email: string;
  role: Exclude<UserRole, 'patient'>;
  clinicId: string | null;
  clinicName?: string | null;
  createdBy: string | null;
};

/** Creates (or replaces) an invite and emails it. The raw link is returned to the inviter too. */
export async function createInvite(input: InviteInput, conn: DbOrTx = db) {
  const email = normalizeEmail(input.email);

  // Only one live invite per email / clinic / role
  await conn
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.purpose, 'invite'),
        eq(authTokens.email, email),
        eq(authTokens.role, input.role),
        input.clinicId ? eq(authTokens.clinicId, input.clinicId) : isNull(authTokens.clinicId),
        isNull(authTokens.usedAt)
      )
    );

  const { raw, hash } = createOneTimeToken();
  const [invite] = await conn
    .insert(authTokens)
    .values({
      purpose: 'invite',
      tokenHash: hash,
      email,
      role: input.role,
      clinicId: input.clinicId,
      createdBy: input.createdBy,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    })
    .returning();

  const inviteUrl = `${env.appUrl}/invite/${raw}`;
  const where = input.clinicName ? ` at <strong>${escapeHtml(input.clinicName)}</strong>` : '';
  const emailSent = await sendMail({
    to: email,
    subject: input.clinicName ? `You're invited to join ${input.clinicName} on Unimeds` : "You're invited to Unimeds",
    heading: 'Your invitation to Unimeds',
    body: `You have been invited to join as a ${ROLE_LABEL[input.role]}${where}. This invitation expires in ${INVITE_TTL_DAYS} days.`,
    cta: { label: 'Accept invitation', url: inviteUrl },
  });

  return { invite: invite!, inviteUrl, emailSent };
}

export async function createPasswordReset(userId: string, email: string) {
  const { raw, hash } = createOneTimeToken();
  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.purpose, 'password_reset'), eq(authTokens.userId, userId), isNull(authTokens.usedAt)));
  await db.insert(authTokens).values({
    purpose: 'password_reset',
    tokenHash: hash,
    email,
    userId,
    expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
  });
  const url = `${env.appUrl}/reset-password/${raw}`;
  await sendMail({
    to: email,
    subject: 'Reset your Unimeds password',
    heading: 'Reset your password',
    body: `We received a request to reset your password. This link expires in ${RESET_TTL_MINUTES} minutes. If you didn't ask for this, you can ignore this email.`,
    cta: { label: 'Choose a new password', url },
  });
}
