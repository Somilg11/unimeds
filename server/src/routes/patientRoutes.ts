import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const requirePatient = [authenticate, authorize('patient')];

// POST /api/v1/auth/sync - Sync user with database
router.post('/auth/sync', ...requirePatient, patientController.syncUser);

// GET /api/v1/user/timeline - Get patient timeline
router.get('/timeline', ...requirePatient, patientController.getTimeline);

// GET /api/v1/user/clinics - Get all clinics
router.get('/clinics', ...requirePatient, patientController.getClinics);

// GET /api/v1/user/doctors - Get doctors (optionally filtered by clinic)
router.get('/doctors', ...requirePatient, patientController.getDoctors);

// GET /api/v1/user/slots - Get available slots for a doctor
router.get('/slots', ...requirePatient, patientController.getAvailableSlots);

// POST /api/v1/user/records/upload - Upload medical record
router.post('/records/upload', ...requirePatient, patientController.uploadRecord);

// POST /api/v1/user/records/:id/process-ocr - Process OCR for record
router.post('/records/:id/process-ocr', ...requirePatient, patientController.processOCR);

// POST /api/v1/user/appointments/book - Book appointment
router.post('/appointments/book', ...requirePatient, patientController.bookAppointment);

// PUT /api/v1/user/profile - Update patient profile
router.put('/profile', ...requirePatient, patientController.updateProfile);

// GET /api/v1/user/profile - Get patient profile
router.get('/profile', ...requirePatient, patientController.getProfile);

// GET /api/v1/user/notifications - Get patient notifications
router.get('/notifications', ...requirePatient, patientController.getNotifications);

// PUT /api/v1/user/notifications - Mark notification as read
router.put('/notifications', ...requirePatient, patientController.markNotificationRead);

export default router;
