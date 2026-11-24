import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createBroadcastNotification,
  createIndividualNotification,
  deleteAdminNotification,
  getNotificationStatistics,
  listAdminNotifications,
  searchNotificationRecipients
} from '../controllers/notification.controller.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
const contentFields = [
  body('title').isString().trim().notEmpty().isLength({ max: 180 }),
  body('body').isString().trim().notEmpty().isLength({ max: 10000 }),
  body('category').optional().isIn(['general', 'project', 'account', 'security', 'reward']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
];

router.get('/recipients',
  query('role').optional().isIn(['user', 'company']),
  query('search').optional().isString().isLength({ max: 120 }),
  validate,
  searchNotificationRecipients
);
router.get('/stats', getNotificationStatistics);
router.get('/',
  query('type').optional().isIn(['broadcast', 'individual']),
  query('status').optional().isIn(['active', 'expired', 'deleted', 'history']),
  query('search').optional().isString().isLength({ max: 120 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('skip').optional().isInt({ min: 0 }),
  validate,
  listAdminNotifications
);
router.post('/broadcast',
  ...contentFields,
  body('audience').optional().isIn(['all', 'users', 'companies']),
  validate,
  createBroadcastNotification
);
router.post('/individual',
  ...contentFields,
  body('recipientId').isMongoId(),
  body('recipientRole').isIn(['user', 'company']),
  validate,
  createIndividualNotification
);
router.delete('/:id', param('id').isMongoId(), validate, deleteAdminNotification);

export default router;
