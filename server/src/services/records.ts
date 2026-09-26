import type { Request } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../db/db.js';
import { appointments, clinics, records, users } from '../db/schema.js';
import { badRequest } from '../lib/http.js';
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, inspectUpload, recordFolder } from './storage.js';
import { audit } from './audit.js';

export const RECORD_TYPES = ['general', 'prescription', 'lab_report', 'imaging', 'discharge_summary', 'vaccination', 'insurance', 'other'] as const;

export const confirmUploadSchema = z.object({
  publicId: z.string().min(1).max(300),
  resourceType: z.enum(['image', 'raw', 'video']),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().max(100).refine((m) => ALLOWED_MIME.has(m), 'Only PDF and image files are allowed'),
  title: z.string().trim().min(1).max(200).optional(),
  recordType: z.enum(RECORD_TYPES).default('general'),
  appointmentId: z.string().uuid().nullable().optional(),
});

export const recordUploader = alias(users, 'uploader');
const uploader = recordUploader;

export const recordSelect = {
  id: records.id,
  patientId: records.patientId,
  title: records.title,
  recordType: records.recordType,
  fileName: records.fileName,
  mimeType: records.mimeType,
  fileSize: records.fileSize,
  appointmentId: records.appointmentId,
  createdAt: records.createdAt,
  uploadedBy: { id: uploader.id, name: uploader.name, role: uploader.role },
  clinic: { id: clinics.id, name: clinics.name },
};

export function recordQuery() {
  return db
    .select(recordSelect)
    .from(records)
    .leftJoin(uploader, eq(uploader.id, records.uploadedBy))
    .leftJoin(clinics, eq(clinics.id, records.clinicId));
}

/** Verifies an upload landed in the patient's folder, then persists the record. */
export async function createRecordFromUpload(
  req: Request,
  input: z.infer<typeof confirmUploadSchema> & { patientId: string; uploadedBy: string; clinicId: string | null }
) {
  if (!input.publicId.startsWith(`${recordFolder(input.patientId)}/`)) throw badRequest('Upload does not belong to this patient');
  const meta = await inspectUpload(input.publicId, input.resourceType);
  if (meta.bytes > MAX_UPLOAD_BYTES) throw badRequest('File is larger than 15 MB');

  let clinicId = input.clinicId;
  if (input.appointmentId) {
    const [appt] = await db.select().from(appointments).where(eq(appointments.id, input.appointmentId)).limit(1);
    if (!appt || appt.patientId !== input.patientId) throw badRequest('Appointment does not belong to this patient');
    clinicId = appt.clinicId;
  }

  const [record] = await db
    .insert(records)
    .values({
      patientId: input.patientId,
      uploadedBy: input.uploadedBy,
      clinicId,
      appointmentId: input.appointmentId ?? null,
      title: input.title || input.fileName.replace(/\.[^.]+$/, ''),
      recordType: input.recordType,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: meta.bytes,
      storagePublicId: input.publicId,
      storageResourceType: meta.resourceType,
      storageFormat: meta.format,
    })
    .returning();
  await audit(req, { action: 'RECORD_UPLOADED', targetType: 'record', targetId: record!.id, clinicId, metadata: { patientId: input.patientId } });
  return record!;
}
