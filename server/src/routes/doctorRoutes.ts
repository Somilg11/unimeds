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

// POST /api/v1/hospital/appointments/:id/notes - Add appointment notes
router.post('/appointments/:id/notes', ...requireDoctor, doctorController.addAppointmentNotes);

// GET /api/v1/hospital/appointments - Get doctor's appointments
router.get('/appointments', ...requireDoctor, doctorController.getDoctorAppointments);

// GET /api/v1/hospital/records - Get doctor's patient records
router.get('/records', ...requireDoctor, doctorController.getDoctorRecords);

export default router;
