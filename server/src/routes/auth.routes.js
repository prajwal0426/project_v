import { Router } from 'express';
import { body } from 'express-validator';
import {
  acceptLatestLegal,
  appleLogin,
  googleLogin,
  loginAdmin,
  loginCompany,
  loginUser,
  registerCompany,
  registerUser
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
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

router.post('/user/register', register, registerUser);
router.post('/user/login', credentials, loginUser);
router.post('/company/register', register, registerCompany);
router.post('/company/login', credentials, loginCompany);
router.post('/admin/login', credentials, loginAdmin);
router.post('/google', googleLogin);
router.post('/apple', appleLogin);
router.patch(
  '/legal-consent',
  authenticate,
  body('privacyPolicyAccepted').equals('true'),
  body('termsAccepted').equals('true'),
  body('ageConfirmed').equals('true'),
  body('privacyPolicyVersion').notEmpty(),
  body('termsVersion').notEmpty(),
  validate,
  acceptLatestLegal
);

console.log("AUTH ROUTES LOADED");

export default router;
