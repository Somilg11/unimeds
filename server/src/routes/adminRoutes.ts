import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const requireAdmin = [authenticate, authorize('super_admin')];

// Public routes (no auth required)
router.post('/login', adminController.superAdminLogin);
router.get('/clinic-by-token', adminController.getClinicByToken);
router.post('/activate-clinic', adminController.activateClinic);

// Clinic management
router.post('/tenants/onboard', ...requireAdmin, adminController.createClinic);
router.get('/clinics', ...requireAdmin, adminController.getClinics);
router.put('/clinics/:clinicId/toggle-status', ...requireAdmin, adminController.toggleClinicStatus);
router.get('/clinics/:clinicId/doctors', ...requireAdmin, adminController.getClinicDoctors);

// Doctor management
router.get('/doctors', ...requireAdmin, adminController.getAllDoctors);
router.post('/doctors', ...requireAdmin, adminController.createDoctor);
router.post('/doctors/assign', ...requireAdmin, adminController.assignDoctorToClinic);
router.delete('/doctors/assign', ...requireAdmin, adminController.removeDoctorFromClinic);

// Platform metrics & audit
router.get('/metrics', ...requireAdmin, adminController.getPlatformMetrics);
router.get('/audit-logs', ...requireAdmin, adminController.getAuditLogs);
router.delete('/audit-logs', ...requireAdmin, adminController.clearAuditLogs);

// Notifications
router.get('/notifications', ...requireAdmin, adminController.getNotifications);
router.put('/notifications', ...requireAdmin, adminController.markNotificationRead);

export default router;
