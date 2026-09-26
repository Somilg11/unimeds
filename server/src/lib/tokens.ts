import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { env } from './env.js';
import type { User } from '../db/schema.js';

export type AccessTokenPayload = { sub: string; role: User['role']; ver: number };

export function signAccessToken(user: Pick<User, 'id' | 'role' | 'tokenVersion'>): string {
  const payload: AccessTokenPayload = { sub: user.id, role: user.role, ver: user.tokenVersion };
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtTtl as jwt.SignOptions['expiresIn'],
    issuer: 'unimeds-api',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret, { issuer: 'unimeds-api' });
  if (typeof decoded === 'string' || !decoded.sub) throw new Error('Invalid token payload');
  return decoded as unknown as AccessTokenPayload;
}

export function tokenExpiry(token: string): number | null {
  const decoded = jwt.decode(token);
  return decoded && typeof decoded !== 'string' && decoded.exp ? decoded.exp : null;
}

// One-time URL tokens (invites, password reset): raw value goes in the link,
// only its hash is persisted.
export function createOneTimeToken() {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
