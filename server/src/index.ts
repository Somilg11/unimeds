import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './lib/env.js';
import { errorHandler, notFound } from './lib/http.js';
import { pool } from './db/db.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import patientRoutes from './routes/patient.js';
import doctorRoutes from './routes/doctor.js';
import clinicRoutes from './routes/clinic.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import recordRoutes from './routes/records.js';

const app = express();

// Behind Vercel / a load balancer the client IP comes from X-Forwarded-For
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Clinic-Id'],
  })
);
app.use(express.json({ limit: '200kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'unreachable' });
  }
});

const api = express.Router();
api.use('/auth', authRoutes);
api.use('/public', publicRoutes);
api.use('/patient', patientRoutes);
api.use('/doctor', doctorRoutes);
api.use('/clinic', clinicRoutes);
api.use('/admin', adminRoutes);
api.use('/notifications', notificationRoutes);
api.use('/records', recordRoutes);
api.use((_req, _res, next) => next(notFound('Endpoint not found')));

app.use('/api/v1', api);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Unimeds API listening on :${env.port}`);
});
