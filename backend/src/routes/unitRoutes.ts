import { Router } from 'express';
import { createUnit, getUnits, getUnit, updateUnit, deleteUnit } from '../controllers/unitController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
router.post('/', roleMiddleware('admin', 'subadmin'), createUnit);
router.get('/', roleMiddleware('admin', 'subadmin', 'concierge', 'financial'), getUnits);
router.get('/:id', getUnit);
router.put('/:id', roleMiddleware('admin'), updateUnit);
router.delete('/:id', roleMiddleware('admin'), deleteUnit);

export default router;
