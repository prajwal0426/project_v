import { Router } from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import projectRoutes from './project.routes.js';
import rankingRoutes from './ranking.routes.js';
import walletRoutes from './wallet.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/wallet', walletRoutes);
router.use('/rankings', rankingRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
