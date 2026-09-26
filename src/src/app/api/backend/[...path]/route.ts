import type { NextRequest } from 'next/server';
import { API_URL } from '@/lib/auth';
import { getApiToken } from '@/lib/server-api';

// Same-origin gateway to the API: the browser never holds the backend token.
async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (path[0] === 'auth' && !['me', 'password', 'logout-all'].includes(path[1] ?? '')) {
    // Login / signup / invite flows go through server actions so the session cookie is set
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const token = await getApiToken(req.headers);
  const target = `${API_URL}/api/v1/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const clinicId = req.headers.get('x-clinic-id');
  if (clinicId) headers.set('x-clinic-id', clinicId);
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  const ua = req.headers.get('user-agent');
  if (ua) headers.set('user-agent', ua);
  if (token) headers.set('authorization', `Bearer ${token}`);

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return Response.json({ error: 'Service unavailable. Please try again shortly.' }, { status: 503 });
  }

  // Auth responses may carry a fresh API token; it must never reach browser JS
  if (path[0] === 'auth' && (upstream.headers.get('content-type') ?? '').includes('application/json')) {
    const data = await upstream.json().catch(() => ({}));
    if (data && typeof data === 'object') delete (data as Record<string, unknown>).token;
    return Response.json(data, { status: upstream.status, headers: { 'cache-control': 'no-store' } });
  }

  const out = new Headers();
  for (const h of ['content-type', 'content-disposition', 'content-length', 'cache-control', 'ratelimit', 'ratelimit-policy', 'retry-after']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  if (!out.has('cache-control')) out.set('cache-control', 'no-store');
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
