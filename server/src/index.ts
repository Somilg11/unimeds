import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './db/db.js';
import adminRoutes from './routes/adminRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import clinicRoutes from './routes/clinicRoutes.js';
import clinicAdminRoutes from './routes/clinicAdminRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'UniMeds API Server' });
});

// API info endpoint (must be before route mounting)
app.get('/api', (req, res) => {
  res.json({
    version: 'v1',
    endpoints: {
      admin: '/api/v1/admin/*',
      patient: '/api/v1/user/*',
      doctor: '/api/v1/hospital/*',
      clinic: '/api/v1/hospital/admin/*',
    },
    note: 'All endpoints require authentication except /health, /, and /api',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', patientRoutes);
app.use('/api/v1/hospital', doctorRoutes);
app.use('/api/v1/hospital', clinicRoutes);
app.use('/api/v1/clinic-admin', clinicAdminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
