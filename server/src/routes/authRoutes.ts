import { Router } from 'express';
import * as authController from '../controllers/authController.js';

const router = Router();

// Public - no auth required
router.post('/oauth', authController.oauthLogin);

export default router;
