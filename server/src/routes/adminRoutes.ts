import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// POST /api/v1/admin/tenants/onboard - Create new clinic tenant
router.post('/tenants/onboard', adminController.createClinic);

// GET /api/v1/admin/metrics - Get platform metrics
router.get('/metrics', adminController.getPlatformMetrics);

// GET /api/v1/admin/audit-logs - Get audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// GET /api/v1/admin/clinics - Get all clinics
router.get('/clinics', adminController.getClinics);

export default router;
