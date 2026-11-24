import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { authenticate, authorize, requireActiveAccount, requireLatestLegalConsent } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
const profileAccess = [authenticate, authorize('user', 'company'), requireActiveAccount, requireLatestLegalConsent];

router.get('/', ...profileAccess, getProfile);
router.patch('/', ...profileAccess, body('name').trim().notEmpty().isLength({ max: 160 }), validate, updateProfile);

export default router;
