import { Router } from 'express';
import * as clinicController from '../controllers/clinicController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const requireClinicAdmin = [authenticate, authorize('clinic_admin')];

// Dashboard & Analytics
router.get('/admin/dashboard', ...requireClinicAdmin, clinicController.getClinicDashboardMetrics);
router.get('/admin/analytics', ...requireClinicAdmin, clinicController.getClinicAnalytics);
router.get('/admin/clinic', ...requireClinicAdmin, clinicController.getClinicById);

// Appointments
router.get('/admin/appointments', ...requireClinicAdmin, clinicController.getClinicAppointments);

// Settings
router.put('/admin/settings', ...requireClinicAdmin, clinicController.updateClinicSettings);

// Staff Management
router.get('/admin/staff', ...requireClinicAdmin, clinicController.getClinicStaff);
router.post('/admin/staff', ...requireClinicAdmin, clinicController.addDoctorToClinic);
router.put('/admin/staff/toggle', ...requireClinicAdmin, clinicController.toggleDoctorActive);
router.delete('/admin/staff', ...requireClinicAdmin, clinicController.removeDoctorFromClinic);

// Patients & Records
router.get('/admin/patients', ...requireClinicAdmin, clinicController.getClinicPatients);
router.get('/admin/records', ...requireClinicAdmin, clinicController.getClinicRecords);

// Notifications
router.get('/admin/notifications', ...requireClinicAdmin, clinicController.getNotifications);
router.put('/admin/notifications/:notificationId/read', ...requireClinicAdmin, clinicController.markNotificationRead);

export default router;
