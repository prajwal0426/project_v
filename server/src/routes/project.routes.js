import { Router } from 'express';
import { body } from 'express-validator';
import { createProject, listProjects, reviewSubmission, submitProject } from '../controllers/project.controller.js';
import { authenticate, authorize, requireActiveAccount, requireLatestLegalConsent, requireNoRestriction } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.get('/', listProjects);
router.post('/', authenticate, authorize('company'), requireActiveAccount, requireLatestLegalConsent, requireNoRestriction('createProjects'), body('title').notEmpty(), validate, createProject);
router.post('/:id/submissions', authenticate, authorize('user'), requireActiveAccount, requireLatestLegalConsent, requireNoRestriction('submitProjects'), upload.single('submission'), submitProject);
router.patch('/submissions/:submissionId/review', authenticate, authorize('company', 'admin'), requireActiveAccount, requireLatestLegalConsent, requireNoRestriction('manageSubmissions'), reviewSubmission);

export default router;
