import { Router } from 'express';
import * as clinicController from '../controllers/clinicController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const requireClinicAdmin = [authenticate, authorize('clinic_admin')];

// Dashboard
router.get('/dashboard', ...requireClinicAdmin, clinicController.getClinicDashboardMetrics);

// Analytics
router.get('/analytics', ...requireClinicAdmin, clinicController.getClinicAnalytics);

// Clinic info
router.get('/clinic', ...requireClinicAdmin, clinicController.getClinicById);

// Appointments
router.get('/appointments', ...requireClinicAdmin, clinicController.getClinicAppointments);

// Settings
router.get('/settings', ...requireClinicAdmin, clinicController.getClinicById);
router.put('/settings', ...requireClinicAdmin, clinicController.updateClinicSettings);

// Staff Management
router.get('/staff', ...requireClinicAdmin, clinicController.getClinicStaff);
router.post('/staff', ...requireClinicAdmin, clinicController.addDoctorToClinic);
router.put('/staff/toggle', ...requireClinicAdmin, clinicController.toggleDoctorActive);
router.delete('/staff', ...requireClinicAdmin, clinicController.removeDoctorFromClinic);

// Patients & Records
router.get('/patients', ...requireClinicAdmin, clinicController.getClinicPatients);
router.get('/records', ...requireClinicAdmin, clinicController.getClinicRecords);

// Notifications
router.get('/notifications', ...requireClinicAdmin, clinicController.getNotifications);
router.put('/notifications', ...requireClinicAdmin, clinicController.markNotificationRead);

export default router;
