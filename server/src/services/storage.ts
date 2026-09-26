import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import { env } from '../lib/env.js';
import { HttpError, badRequest } from '../lib/http.js';

// Medical files are uploaded as Cloudinary "authenticated" assets: they are not
// reachable by public URL. The API streams them to authorised users only.

const configured = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

if (configured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

const RESOURCE_TYPES = ['image', 'raw', 'video'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

function ensureConfigured() {
  if (!configured) throw new HttpError(503, 'File storage is not configured', 'STORAGE_UNAVAILABLE');
}

export const recordFolder = (patientId: string) => `unimeds/records/${patientId}`;

export function createUploadTicket(patientId: string) {
  ensureConfigured();
  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `${recordFolder(patientId)}/${randomUUID()}`;
  const params = { timestamp, public_id: publicId, type: 'authenticated' };
  const signature = cloudinary.utils.api_sign_request(params, env.cloudinary.apiSecret);
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/auto/upload`,
    fields: { ...params, api_key: env.cloudinary.apiKey, signature },
    publicId,
    maxBytes: MAX_UPLOAD_BYTES,
  };
}

/** Confirms an uploaded asset exists and returns its authoritative metadata. */
export async function inspectUpload(publicId: string, resourceType: string) {
  ensureConfigured();
  if (!RESOURCE_TYPES.includes(resourceType as ResourceType)) throw badRequest('Invalid resource type');
  try {
    const res = await cloudinary.api.resource(publicId, { type: 'authenticated', resource_type: resourceType });
    return {
      bytes: Number(res.bytes) || 0,
      format: (res.format as string | undefined) ?? null,
      resourceType: resourceType as ResourceType,
    };
  } catch {
    throw badRequest('Upload not found. Please upload the file again.', 'UPLOAD_NOT_FOUND');
  }
}

export async function destroyAsset(publicId: string, resourceType: string) {
  ensureConfigured();
  const res = await cloudinary.uploader.destroy(publicId, {
    type: 'authenticated',
    resource_type: resourceType,
    invalidate: true,
  });
  if (res.result !== 'ok' && res.result !== 'not found') {
    throw new HttpError(502, 'Could not delete the file from storage. Please try again.');
  }
}

/** Short-lived signed URL used server-side to stream the file to the client. */
export function privateFileUrl(publicId: string, resourceType: string, format: string | null) {
  ensureConfigured();
  return cloudinary.utils.private_download_url(publicId, format ?? '', {
    resource_type: resourceType,
    type: 'authenticated',
    expires_at: Math.round(Date.now() / 1000) + 120,
  });
}
