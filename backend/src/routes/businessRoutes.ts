import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/authenticate';
import { authorizeRole } from '../middlewares/authorizeRole';
import {
  getPanel,
  createBusiness,
  list,
  search,
  getFeaturedCategory,
  listByCategory,
  updateBusiness,
  deleteBusiness,
  hideBusiness,
  restoreBusiness,
  getBusinessById,
  toggleBusinessLike,
  toggleBusinessReport,
  registerBusinessClick,
} from '../controllers/businessController';

const router = Router();

router.get('/', list);
router.get('/search', search);
router.get('/featured-category', getFeaturedCategory);
router.get('/category/:category', listByCategory);

router.get(
  '/panel',
  authenticate,
  authorizeRole(['BUSINESS', 'ADMIN'], {
    forbiddenMessage: 'Access denied. Business account required.',
  }),
  getPanel
);

router.get('/:id', optionalAuthenticate, getBusinessById);

router.post(
  '/',
  authenticate,
  authorizeRole(['BUSINESS', 'ADMIN'], { forbiddenMessage: 'Access denied. Business account required.' }),
  createBusiness
);

router.post('/:id/like', authenticate, toggleBusinessLike);
router.post('/:id/report', authenticate, toggleBusinessReport);
router.post('/:id/click', authenticate, registerBusinessClick);

router.patch('/:id/hide', authenticate, authorizeRole('ADMIN', { forbiddenMessage: 'Admin only' }), hideBusiness);
router.patch('/:id/restore', authenticate, authorizeRole('ADMIN', { forbiddenMessage: 'Admin only' }), restoreBusiness);

router.put('/:id', authenticate, updateBusiness);
router.delete('/:id', authenticate, deleteBusiness);

export default router;

