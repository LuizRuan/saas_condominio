import { Router } from 'express';
import { createResident, createResidentInvite, getResidents, getResident, getMyResident, updateResident, deleteResident } from '../controllers/residentController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
// /me must come before /:id to avoid being matched as an id param
router.get('/me', getMyResident);
router.post('/', roleMiddleware('admin', 'subadmin'), createResident);
router.get('/', roleMiddleware('admin', 'subadmin', 'concierge'), getResidents);
router.get('/:id', roleMiddleware('admin', 'subadmin', 'concierge'), getResident);
router.post('/:id/invite', roleMiddleware('admin', 'subadmin'), createResidentInvite);
router.put('/:id', roleMiddleware('admin', 'subadmin'), updateResident);
router.delete('/:id', roleMiddleware('admin', 'subadmin'), deleteResident);

export default router;
