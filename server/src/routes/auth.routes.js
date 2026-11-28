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
import { resendRegistrationOtpController, startRegistrationOtp } from '../controllers/registration-otp.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { registrationUpload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { isEmailVerificationEnabled, isRegistrationOtpValid } from '../config/email-verification.js';

const router = Router();
const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});
const registrationOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification requests. Please try again later.' }
});
const protectRegistrationOtp = (req, res, next) => (
  isEmailVerificationEnabled() ? registrationOtpLimiter(req, res, next) : next()
);
const credentials = [body('email').isEmail(), body('password').isLength({ min: 8 }), validate];
const registerFields = [
  body('name').trim().notEmpty().isLength({ max: 180 }),
  body('email').trim().isEmail({ require_tld: true }).isLength({ max: 255 }),
  body('password').isLength({ min: 8 }),
  body('otp').custom(isRegistrationOtpValid).withMessage('A valid 6-digit verification code is required.'),
  body('privacyPolicyAccepted').equals('true'),
  body('termsAccepted').equals('true'),
  body('ageConfirmed').equals('true'),
  body('privacyPolicyVersion').notEmpty(),
  body('termsVersion').notEmpty()
];

router.post('/registration-otp', protectRegistrationOtp, body('email').trim().isEmail({ require_tld: true }).isLength({ max: 255 }), validate, startRegistrationOtp);
router.post('/registration-otp/resend', protectRegistrationOtp, body('email').trim().isEmail({ require_tld: true }).isLength({ max: 255 }), validate, resendRegistrationOtpController);
router.post('/user/register', authenticationLimiter, registrationUpload.single('governmentId'), ...registerFields, body('name').isLength({ max: 160 }), body('dateOfBirth').isISO8601(), validate, registerUser);
router.post('/user/login', authenticationLimiter, credentials, loginUser);
router.post('/company/register', authenticationLimiter, registrationUpload.single('governmentId'), ...registerFields, validate, registerCompany);
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
  body('otp').optional().matches(/^\d{6}$/),
  validate,
  acceptLatestLegal
);

export default router;
