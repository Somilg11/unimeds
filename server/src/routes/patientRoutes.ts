import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All patient routes require authentication and patient role
router.use(authenticate);
router.use(authorize('patient'));

// POST /api/v1/auth/sync - Sync user with database
router.post('/auth/sync', patientController.syncUser);

// GET /api/v1/user/timeline - Get patient timeline
router.get('/timeline', patientController.getTimeline);

// GET /api/v1/user/clinics - Get all clinics
router.get('/clinics', patientController.getClinics);

// GET /api/v1/user/doctors - Get doctors (optionally filtered by clinic)
router.get('/doctors', patientController.getDoctors);

// GET /api/v1/user/slots - Get available slots for a doctor
router.get('/slots', patientController.getAvailableSlots);

// POST /api/v1/user/records/upload - Upload medical record
router.post('/records/upload', patientController.uploadRecord);

// POST /api/v1/user/records/:id/process-ocr - Process OCR for record
router.post('/records/:id/process-ocr', patientController.processOCR);

// POST /api/v1/user/appointments/book - Book appointment
router.post('/appointments/book', patientController.bookAppointment);

// PUT /api/v1/user/profile - Update patient profile
router.put('/profile', patientController.updateProfile);

// GET /api/v1/user/profile - Get patient profile
router.get('/profile', patientController.getProfile);

export default router;
