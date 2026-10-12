import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import {
  acceptLatestLegal,
  appleLogin,
  getAuthSession,
  getLegalRequirements,
  googleLogin,
  loginAdmin,
  loginCompany,
  loginUser,
  logoutAdmin,
  registerCompany,
  registerUser
} from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});
const credentials = [body('email').isEmail(), body('password').isLength({ min: 8 }), validate];
const register = [
  upload.single('governmentId'),
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('privacyPolicyAccepted').equals('true'),
  body('termsAccepted').equals('true'),
  body('ageConfirmed').equals('true'),
  body('privacyPolicyVersion').notEmpty(),
  body('termsVersion').notEmpty(),
  validate
];

router.post('/user/register', authenticationLimiter, register, registerUser);
router.post('/user/login', authenticationLimiter, credentials, loginUser);
router.post('/company/register', authenticationLimiter, register, registerCompany);
router.post('/company/login', authenticationLimiter, credentials, loginCompany);
router.post('/admin/login', authenticationLimiter, body('username').trim().notEmpty().isLength({ max: 160 }), body('password').isString().isLength({ min: 1, max: 512 }), validate, loginAdmin);
router.post('/admin/logout', authenticate, authorize('admin'), logoutAdmin);
router.get('/session', authenticate, getAuthSession);
router.get('/legal-requirements', getLegalRequirements);
router.post('/google', authenticationLimiter, googleLogin);
router.post('/apple', authenticationLimiter, appleLogin);
router.patch(
  '/legal-consent',
  authenticate,
  body('privacyPolicyAccepted').custom((value) => value === true || value === 'true'),
  body('termsAccepted').custom((value) => value === true || value === 'true'),
  body('ageConfirmed').optional().isBoolean(),
  validate,
  acceptLatestLegal
);

export default router;
