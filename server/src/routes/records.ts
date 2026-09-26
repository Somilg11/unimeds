import { Router } from 'express';
import { Readable } from 'stream';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { records } from '../db/schema.js';
import { authenticate, authUser } from '../middleware/auth.js';
import { HttpError, notFound } from '../lib/http.js';
import { privateFileUrl } from '../services/storage.js';
import { doctorClinicIds, doctorRecordAccess } from '../services/access.js';
import { audit } from '../services/audit.js';
import { membershipsOf } from '../services/users.js';

const router = Router();

/**
 * Streams a record's file after checking the caller may read it. Files are
 * never exposed by public URL.
 */
router.get('/:id/file', authenticate, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const me = authUser(req);

  const [record] = await db.select().from(records).where(eq(records.id, id)).limit(1);
  if (!record) throw notFound('Record not found');

  let allowed = false;
  if (me.role === 'patient') allowed = record.patientId === me.id;
  else if (me.role === 'doctor') {
    const clinicIds = await doctorClinicIds(me.id);
    if (clinicIds.length) {
      const [hit] = await db
        .select({ id: records.id })
        .from(records)
        .where(and(eq(records.id, id), doctorRecordAccess(me.id, clinicIds)))
        .limit(1);
      allowed = Boolean(hit);
    }
  } else if (me.role === 'clinic_admin') {
    const adminClinics = (await membershipsOf(me.id)).filter((m) => m.role === 'clinic_admin' && m.isActive && m.clinicStatus === 'active');
    allowed = Boolean(record.clinicId && adminClinics.some((m) => m.clinicId === record.clinicId));
  }
  if (!allowed) throw notFound('Record not found');

  const upstream = await fetch(privateFileUrl(record.storagePublicId, record.storageResourceType, record.storageFormat));
  if (!upstream.ok || !upstream.body) throw new HttpError(502, 'Could not load the file. Please try again.');

  await audit(req, { action: 'RECORD_VIEWED', targetType: 'record', targetId: record.id, clinicId: record.clinicId });

  const disposition = req.query.download === '1' ? 'attachment' : 'inline';
  res.setHeader('Content-Type', record.mimeType || upstream.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(record.fileName)}`);
  res.setHeader('Cache-Control', 'private, no-store');
  const length = upstream.headers.get('content-length');
  if (length) res.setHeader('Content-Length', length);
  Readable.fromWeb(upstream.body as import('stream/web').ReadableStream).pipe(res);
});

export default router;
