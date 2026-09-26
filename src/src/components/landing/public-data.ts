import 'server-only';
import { publicApi } from '@/lib/server-api';
import { ApiError } from '@/lib/api-error';
import type { Paged, PublicClinic, PublicDoctor } from '@/lib/types';

export type PublicStats = { clinics: number; doctors: number; cities: number };
export type Specialization = { name: string; doctors: number };
export type PublicClinicDetail = PublicClinic & {
  bookingWindowDays: number;
  slotDurationMinutes: number;
  cancellationHours: number;
};
export type ClinicDoctor = Omit<PublicDoctor, 'clinics'>;

/** Returns null instead of throwing when the API is unreachable or errors. */
export async function tryPublic<T>(path: string): Promise<T | null> {
  try {
    return await publicApi<T>(path);
  } catch {
    return null;
  }
}

/** Returns null for 400/404 (unknown or malformed id); rethrows anything else. */
export async function findPublic<T>(path: string): Promise<T | null> {
  try {
    return await publicApi<T>(path);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export type SearchParams = Record<string, string | string[] | undefined>;

export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Builds a query string from the given keys, dropping empty values. */
export function toQuery(sp: SearchParams, keys: string[], extra: Record<string, string> = {}) {
  const q = new URLSearchParams();
  for (const k of keys) {
    const v = first(sp[k]).trim();
    if (v) q.set(k, v);
  }
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export type { Paged, PublicClinic, PublicDoctor };
