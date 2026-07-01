import { Router } from 'express';
import { getRankings, refreshRankings } from '../controllers/ranking.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getRankings);
router.post('/refresh', authenticate, authorize('admin'), refreshRankings);

export default router;
