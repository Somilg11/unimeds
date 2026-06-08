import { Router } from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All doctor routes require authentication and doctor role
router.use(authenticate);
router.use(authorize('doctor'));

// GET /api/v1/hospital/patients/search - Search patients
router.get('/patients/search', doctorController.searchPatients);

// GET /api/v1/hospital/patients/:id/context - Get patient clinical context
router.get('/patients/:id/context', doctorController.getPatientContext);

// POST /api/v1/hospital/appointments/:id/notes - Add appointment notes
router.post('/appointments/:id/notes', doctorController.addAppointmentNotes);

// GET /api/v1/hospital/appointments - Get doctor's appointments
router.get('/appointments', doctorController.getDoctorAppointments);

export default router;
