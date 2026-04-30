import { Router } from 'express';
import authRoutes from './authRoutes';
import businessRoutes from './businessRoutes';
import usersRoutes from './usersRoutes';
import adminRoutes from './adminRoutes';
import rankingRoutes from './rankingRoutes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'empripanel-backend' });
});

router.use('/auth', authRoutes);
router.use('/business', businessRoutes);
router.use('/users', usersRoutes);
router.use('/user', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/rankings', rankingRoutes);

export default router;


