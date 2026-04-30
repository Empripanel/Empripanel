import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import {
  updateMe,
  updatePassword,
  deleteMe,
  updateRole,
  getLikedBusinesses,
  getVisitHistory,
  getInteractionState,
} from '../controllers/usersController';

const router = Router();

router.use(authenticate);

router.patch('/me', updateMe);
router.patch('/password', updatePassword);
router.delete('/me', deleteMe);
router.patch('/role', updateRole);
router.get('/likes', getLikedBusinesses);
router.get('/visits', getVisitHistory);
router.get('/interaction-state', getInteractionState);

export default router;

