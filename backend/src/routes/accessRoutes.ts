import { Router } from 'express';
import { getAccesses, createAccess, finishAccess } from '../controllers/accessController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.use(protect);
router.use(restrictTo('admin', 'subadmin', 'concierge'));

router.route('/')
  .get(getAccesses)
  .post(createAccess);

router.patch('/:id/finish', finishAccess);

export default router;
