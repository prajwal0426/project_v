import { Router } from 'express';
import { body } from 'express-validator';
import { createPurchase, getWallet, withdraw } from '../controllers/wallet.controller.js';
import { authenticate, authorize, requireLatestLegalConsent } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('user'), requireLatestLegalConsent, getWallet);
router.post('/withdraw', authenticate, authorize('user'), requireLatestLegalConsent, body('paypalEmail').isEmail(), body('coinAmount').isNumeric(), validate, withdraw);
router.post('/paypal/order', authenticate, requireLatestLegalConsent, createPurchase);

export default router;
