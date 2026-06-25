import { Router } from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const requireDoctor = [authenticate, authorize('doctor')];

// Public login endpoint (no auth required)
router.post('/login', doctorController.doctorLogin);

// GET /api/v1/hospital/patients/search - Search patients
router.get('/patients/search', ...requireDoctor, doctorController.searchPatients);

// GET /api/v1/hospital/patients/:id/context - Get patient clinical context
router.get('/patients/:id/context', ...requireDoctor, doctorController.getPatientContext);

// GET /api/v1/hospital/patients/:id/medical-history - Get patient medical history
router.get('/patients/:id/medical-history', ...requireDoctor, doctorController.getPatientMedicalHistory);

// POST /api/v1/hospital/records/upload - Upload record for a patient
router.post('/records/upload', ...requireDoctor, doctorController.uploadRecordForPatient);

// POST /api/v1/hospital/appointments/:id/notes - Add appointment notes
router.post('/appointments/:id/notes', ...requireDoctor, doctorController.addAppointmentNotes);

// POST /api/v1/hospital/appointments/:id/reschedule - Propose reschedule
router.post('/appointments/:id/reschedule', ...requireDoctor, doctorController.proposeReschedule);

// GET /api/v1/hospital/appointments - Get doctor's appointments
router.get('/appointments', ...requireDoctor, doctorController.getDoctorAppointments);

// GET /api/v1/hospital/records - Get doctor's patient records
router.get('/records', ...requireDoctor, doctorController.getDoctorRecords);

// GET /api/v1/hospital/availability - Get doctor's availability
router.get('/availability', ...requireDoctor, doctorController.getMyAvailability);

// PUT /api/v1/hospital/availability - Set doctor's availability
router.put('/availability', ...requireDoctor, doctorController.setMyAvailability);

// DELETE /api/v1/hospital/availability/:id - Delete an availability slot
router.delete('/availability/:id', ...requireDoctor, doctorController.deleteAvailabilitySlot);

// GET /api/v1/hospital/notifications - Get doctor's notifications
router.get('/notifications', ...requireDoctor, doctorController.getNotifications);

// PUT /api/v1/hospital/notifications - Mark notification as read
router.put('/notifications', ...requireDoctor, doctorController.markNotificationRead);

// POST /api/v1/hospital/appointments/:id/complete - Mark appointment as completed
router.post('/appointments/:id/complete', ...requireDoctor, doctorController.completeAppointment);

export default router;
