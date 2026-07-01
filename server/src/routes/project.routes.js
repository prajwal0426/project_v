import { Router } from 'express';
import { body } from 'express-validator';
import { createProject, listProjects, reviewSubmission, submitProject } from '../controllers/project.controller.js';
import { authenticate, authorize, requireLatestLegalConsent } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.get('/', listProjects);
router.post('/', authenticate, authorize('company'), requireLatestLegalConsent, body('title').notEmpty(), validate, createProject);
router.post('/:id/submissions', authenticate, authorize('user'), requireLatestLegalConsent, upload.single('submission'), submitProject);
router.patch('/submissions/:submissionId/review', authenticate, authorize('company', 'admin'), requireLatestLegalConsent, reviewSubmission);

export default router;
