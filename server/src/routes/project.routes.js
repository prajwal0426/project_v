import { Router } from 'express';
import { body, param } from 'express-validator';
import { createProject, listProjects, reviewSubmission, submitProject } from '../controllers/project.controller.js';
import { authenticate, authorize, requireActiveAccount, requireLatestLegalConsent, requireNoRestriction } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.get('/', listProjects);
router.post('/', authenticate, authorize('company'), requireActiveAccount, requireLatestLegalConsent, requireNoRestriction('createProjects'), body('title').trim().notEmpty().isLength({ max: 180 }), body('difficulty').isIn(['easy', 'medium', 'hard']), body('coinReward').optional().isInt({ min: 0 }), body(['budgetInr', 'rewardPoolInr', 'bonusInr', 'paymentInr']).optional().isFloat({ min: 0 }), validate, createProject);
router.post('/:id/submissions', authenticate, authorize('user'), requireActiveAccount, requireLatestLegalConsent, requireNoRestriction('submitProjects'), param('id').isMongoId(), validate, upload.single('submission'), submitProject);
router.patch('/submissions/:submissionId/review', authenticate, authorize('company', 'admin'), requireActiveAccount, requireLatestLegalConsent, requireNoRestriction('manageSubmissions'), param('submissionId').isMongoId(), body('status').isIn(['approved', 'rejected']), body('feedback').optional().isString().isLength({ max: 4000 }), body('feedbackScore').optional().isFloat({ min: 0, max: 100 }), body('starRating').optional().isFloat({ min: 0, max: 5 }), validate, reviewSubmission);

export default router;
