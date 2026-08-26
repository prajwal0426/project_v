import { Router } from 'express';
import { adminDashboard, companyDashboard, userDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, authorize, requireActiveAccount, requireLatestLegalConsent } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/user', authenticate, authorize('user'), requireActiveAccount, requireLatestLegalConsent, userDashboard);
router.get('/company', authenticate, authorize('company'), requireActiveAccount, requireLatestLegalConsent, companyDashboard);
router.get('/admin', authenticate, authorize('admin'), adminDashboard);

export default router;
