import { Router } from 'express';
import * as clinicController from '../controllers/clinicController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All clinic routes require authentication and clinic_admin role
router.use(authenticate);
router.use(authorize('clinic_admin'));

// GET /api/v1/hospital/admin/appointments - Get clinic appointments
router.get('/admin/appointments', clinicController.getClinicAppointments);

// GET /api/v1/hospital/admin/analytics - Get clinic analytics
router.get('/admin/analytics', clinicController.getClinicAnalytics);

// GET /api/v1/hospital/admin/dashboard - Get clinic dashboard metrics
router.get('/admin/dashboard', clinicController.getClinicDashboardMetrics);

// PUT /api/v1/hospital/admin/settings - Update clinic settings
router.put('/admin/settings', clinicController.updateClinicSettings);

export default router;
