import { Router } from 'express';
import { getAccesses, createAccess, finishAccess } from '../controllers/accessController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'subadmin', 'concierge'));

router.route('/')
  .get(getAccesses)
  .post(createAccess);

router.patch('/:id/finish', finishAccess);

export default router;
