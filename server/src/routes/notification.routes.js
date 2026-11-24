import { Router } from 'express';
import { param, query } from 'express-validator';
import { getMyUnreadCount, listMyNotifications, viewMyNotification } from '../controllers/notification.controller.js';
import { authenticate, authorize, requireActiveAccount, requireLatestLegalConsent } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
const recipientAccess = [authenticate, authorize('user', 'company'), requireActiveAccount, requireLatestLegalConsent];

router.use(...recipientAccess);
router.get('/unread-count', getMyUnreadCount);
router.get('/', query('limit').optional().isInt({ min: 1, max: 100 }), query('skip').optional().isInt({ min: 0 }), validate, listMyNotifications);
router.post('/:id/view', param('id').isMongoId(), validate, viewMyNotification);

export default router;
