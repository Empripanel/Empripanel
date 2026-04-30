import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRole } from '../middlewares/authorizeRole';
import { getHiddenBusinesses, resetPasswordForUser } from '../controllers/adminController';

const router = Router();

router.get(
  '/hidden-businesses',
  authenticate,
  authorizeRole('ADMIN', { forbiddenMessage: 'Admin only' }),
  getHiddenBusinesses
);

router.patch(
  '/reset-password',
  authenticate,
  authorizeRole('ADMIN', { forbiddenMessage: 'Admin only' }),
  resetPasswordForUser
);

export default router;
