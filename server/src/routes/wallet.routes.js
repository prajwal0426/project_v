import { Router } from 'express';
import { body } from 'express-validator';
import { createPurchase, getWallet, withdraw } from '../controllers/wallet.controller.js';
import { authenticate, authorize, requireActiveAccount, requireLatestLegalConsent, requireNoRestriction } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('user'), requireActiveAccount, requireLatestLegalConsent, getWallet);
router.post('/withdraw', authenticate, authorize('user'), requireActiveAccount, requireLatestLegalConsent, requireNoRestriction('withdraw'), body('paypalEmail').isEmail(), body('coinAmount').isNumeric(), validate, withdraw);
router.post('/paypal/order', authenticate, requireActiveAccount, requireLatestLegalConsent, requireNoRestriction('financialActions'), createPurchase);

export default router;
