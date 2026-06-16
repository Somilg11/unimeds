import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All patient routes require authentication but NOT a specific role.
// Controllers scope data by req.user.id so any authenticated user is safe.
// This avoids 403 when a user signs in via Google OAuth and has a different
// role in the database (e.g. clinic_admin) but wants to use the patient portal.

// POST /api/v1/user/auth/sync - Sync user with database
router.post('/auth/sync', authenticate, patientController.syncUser);

// GET /api/v1/user/timeline - Get patient timeline
router.get('/timeline', authenticate, patientController.getTimeline);

// GET /api/v1/user/clinics - Get all clinics
router.get('/clinics', authenticate, patientController.getClinics);

// GET /api/v1/user/doctors - Get doctors (optionally filtered by clinic)
router.get('/doctors', authenticate, patientController.getDoctors);

// GET /api/v1/user/slots - Get available slots for a doctor
router.get('/slots', authenticate, patientController.getAvailableSlots);

// POST /api/v1/user/records/upload - Upload medical record
router.post('/records/upload', authenticate, patientController.uploadRecord);

// POST /api/v1/user/records/:id/process-ocr - Process OCR for record
router.post('/records/:id/process-ocr', authenticate, patientController.processOCR);

// POST /api/v1/user/appointments/book - Book appointment
router.post('/appointments/book', authenticate, patientController.bookAppointment);

// PUT /api/v1/user/profile - Update patient profile
router.put('/profile', authenticate, patientController.updateProfile);

// GET /api/v1/user/profile - Get patient profile
router.get('/profile', authenticate, patientController.getProfile);

// GET /api/v1/user/notifications - Get patient notifications
router.get('/notifications', authenticate, patientController.getNotifications);

// PUT /api/v1/user/notifications - Mark notification as read
router.put('/notifications', authenticate, patientController.markNotificationRead);

export default router;
