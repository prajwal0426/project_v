import { Router } from 'express';
import { param } from 'express-validator';
import { listAdminDevices, revokeAdminDeviceAccess } from '../controllers/admin-device.controller.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.get('/', listAdminDevices);
router.delete('/:deviceId', param('deviceId').isMongoId(), validate, revokeAdminDeviceAccess);

export default router;
