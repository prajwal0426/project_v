import { Router } from 'express';
import { param } from 'express-validator';
import {
  forceLogoutManagedAccount,
  getManagedAccount,
  listAuditLogs,
  listManagedAccounts,
  requestManagedPasswordReset,
  updateManagedRestrictions,
  updateManagedStatus
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
const adminOnly = [authenticate, authorize('admin')];
const accountParams = [
  param('kind').isIn(['users', 'companies']),
  param('id').isUUID(),
  validate
];

router.use(adminOnly);

router.get('/audit-logs', listAuditLogs);
router.get('/:kind', param('kind').isIn(['users', 'companies']), validate, listManagedAccounts);
router.get('/:kind/:id', accountParams, getManagedAccount);
router.patch('/:kind/:id/status', accountParams, updateManagedStatus);
router.patch('/:kind/:id/restrictions', accountParams, updateManagedRestrictions);
router.post('/:kind/:id/force-logout', accountParams, forceLogoutManagedAccount);
router.post('/:kind/:id/password-reset', accountParams, requestManagedPasswordReset);

export default router;
