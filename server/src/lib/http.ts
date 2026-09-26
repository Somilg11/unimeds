import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, code?: string) => new HttpError(400, msg, code);
export const unauthorized = (msg = 'Authentication required') => new HttpError(401, msg, 'UNAUTHORIZED');
export const forbidden = (msg = 'You do not have access to this resource') => new HttpError(403, msg, 'FORBIDDEN');
export const notFound = (msg = 'Not found') => new HttpError(404, msg, 'NOT_FOUND');
export const conflict = (msg: string, code = 'CONFLICT') => new HttpError(409, msg, code);

export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function pageParams(query: unknown) {
  const { page, pageSize } = paginationSchema.parse(query);
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

export function paged<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

// Postgres unique_violation
const PG_UNIQUE = '23505';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return res.status(400).json({
      error: first ? `${first.path.join('.') || 'input'}: ${first.message}` : 'Invalid input',
      code: 'VALIDATION_ERROR',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  const pgErr = ((err as { cause?: unknown })?.cause ?? err) as { code?: string; constraint?: string };
  if (pgErr?.code === PG_UNIQUE) {
    if (pgErr.constraint === 'appointments_doctor_slot_active_uq') {
      return res.status(409).json({ error: 'That slot was just booked. Please pick another time.', code: 'SLOT_UNAVAILABLE' });
    }
    if (pgErr.constraint === 'users_email_uq') {
      return res.status(409).json({ error: 'An account with this email already exists', code: 'EMAIL_TAKEN' });
    }
    return res.status(409).json({ error: 'This record already exists or conflicts with another one', code: 'CONFLICT' });
  }
  if ((err as { type?: string })?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.', code: 'INTERNAL' });
}
