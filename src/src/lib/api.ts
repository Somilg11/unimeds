'use client';

import { signOut } from 'next-auth/react';
import { ApiError } from '@/lib/api-error';
import type { RecordItem, RecordType, UploadTicket } from '@/lib/types';

export { ApiError, errorMessage } from '@/lib/api-error';

type Query = Record<string, string | number | boolean | null | undefined>;

export function qs(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

let signingOut = false;

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  const res = await fetch(`/api/backend${path}${qs(query)}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !signingOut) {
      // Backend session is gone (expired, revoked, deactivated): end the local session too
      signingOut = true;
      void signOut({ redirectTo: `/login?expired=1&next=${encodeURIComponent(location.pathname)}` });
    }
    throw new ApiError(res.status, data.error || 'Request failed', data.code);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown = {}) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown = {}) => request<T>('PATCH', path, body),
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
};

/** Same-origin URL that streams a record's file after an access check. */
export const recordFileUrl = (id: string, download = false) => `/api/backend/records/${id}/file${download ? '?download=1' : ''}`;

export const ACCEPTED_UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Uploads a medical document:
 *   1. ask the API for a signed ticket,
 *   2. upload straight to storage,
 *   3. confirm with the API (which verifies the asset before creating the record).
 * `base` is '/patient' or '/doctor'.
 */
export async function uploadRecord(
  base: '/patient' | '/doctor',
  file: File,
  meta: { recordType?: RecordType; title?: string; appointmentId?: string | null; patientId?: string },
  onProgress?: (pct: number) => void
): Promise<RecordItem> {
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) throw new ApiError(400, 'Only PDF and image files (JPG, PNG, WebP, HEIC) are supported');
  const ticket = await api.post<UploadTicket>(`${base}/records/upload-ticket`, meta.patientId ? { patientId: meta.patientId } : {});
  if (file.size > ticket.maxBytes) throw new ApiError(400, `File is larger than ${Math.round(ticket.maxBytes / 1024 / 1024)} MB`);

  const form = new FormData();
  for (const [k, v] of Object.entries(ticket.fields)) form.append(k, String(v));
  form.append('file', file);

  const uploaded = await new Promise<{ public_id: string; resource_type: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', ticket.uploadUrl);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText || '{}');
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(xhr.status, data?.error?.message || 'Upload failed'));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'));
    xhr.send(form);
  });

  const { record } = await api.post<{ record: RecordItem }>(`${base}/records`, {
    publicId: uploaded.public_id,
    resourceType: uploaded.resource_type,
    fileName: file.name,
    mimeType: file.type,
    title: meta.title,
    recordType: meta.recordType ?? 'general',
    appointmentId: meta.appointmentId ?? undefined,
    patientId: meta.patientId,
  });
  return record;
}
