import { Router } from 'express';
import { adminDashboard, companyDashboard, userDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, authorize, requireLatestLegalConsent } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/user', authenticate, authorize('user'), requireLatestLegalConsent, userDashboard);
router.get('/company', authenticate, authorize('company'), requireLatestLegalConsent, companyDashboard);
router.get('/admin', authenticate, authorize('admin'), adminDashboard);

export default router;
