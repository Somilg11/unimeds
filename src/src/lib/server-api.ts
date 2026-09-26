import 'server-only';
import { getToken } from 'next-auth/jwt';
import { headers } from 'next/headers';
import { API_URL } from '@/lib/auth';
import { ApiError } from '@/lib/api-error';

/** Reads the backend token from the encrypted session cookie. Server-only. */
export async function getApiToken(reqHeaders?: Headers): Promise<string | null> {
  const h = reqHeaders ?? (await headers());
  const proto = h.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const jwt = await getToken({
    req: { headers: h },
    secret: process.env.AUTH_SECRET,
    secureCookie: proto === 'https',
  });
  const token = jwt?.apiToken;
  if (!token) return null;
  if (typeof jwt.apiTokenExp === 'number' && jwt.apiTokenExp * 1000 < Date.now()) return null;
  return token;
}

/** Client IP / UA of the incoming request, so API rate limits and audit logs see the real user. */
async function clientHeaders(): Promise<Record<string, string>> {
  let h: Headers;
  try {
    h = await headers();
  } catch {
    return {}; // outside a request (build time)
  }
  const out: Record<string, string> = {};
  const ip = h.get('x-forwarded-for') ?? h.get('x-real-ip');
  if (ip) out['x-forwarded-for'] = ip;
  const ua = h.get('user-agent');
  if (ua) out['user-agent'] = ua;
  return out;
}

/** Fetch from the API inside Server Components / Server Actions. */
export async function serverApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getApiToken();
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(await clientHeaders()),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error || 'Request failed', body.code);
  return body as T;
}

/** Unauthenticated call used by auth server actions. */
export async function publicApi<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = init;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(await clientHeaders()),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error || 'Request failed', body.code);
  return body as T;
}
