import { Router } from 'express';
import {
  getTopClicked,
  getTopLiked,
  getNewBusinesses,
} from '../controllers/rankingController';

const router = Router();

router.get('/top-clicked', getTopClicked);
router.get('/top-liked', getTopLiked);
router.get('/new', getNewBusinesses);

export default router;
