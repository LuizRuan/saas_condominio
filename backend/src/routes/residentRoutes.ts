import { Router } from 'express';
import { createResident, createResidentInvite, getResidents, getResident, getMyResident, updateResident, deleteResident } from '../controllers/residentController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
// /me must come before /:id to avoid being matched as an id param
router.get('/me', getMyResident);
router.post('/', roleMiddleware('admin'), createResident);
router.get('/', roleMiddleware('admin'), getResidents);
router.get('/:id', roleMiddleware('admin'), getResident);
router.post('/:id/invite', roleMiddleware('admin'), createResidentInvite);
router.put('/:id', roleMiddleware('admin'), updateResident);
router.delete('/:id', roleMiddleware('admin'), deleteResident);

export default router;
