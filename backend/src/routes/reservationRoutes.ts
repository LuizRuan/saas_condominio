import { Router } from 'express';
import {
  createReservation, getReservations, getReservation,
  approveReservation, rejectReservation, cancelReservation, deleteReservation,
  getReservationBlocks, createReservationBlock, deleteReservationBlock,
} from '../controllers/reservationController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
router.post('/', createReservation);
router.get('/blocks/list', getReservationBlocks);
router.post('/blocks', roleMiddleware('admin', 'subadmin', 'concierge'), createReservationBlock);
router.delete('/blocks/:id', roleMiddleware('admin', 'subadmin', 'concierge'), deleteReservationBlock);
router.get('/', getReservations);
router.get('/:id', getReservation);
router.patch('/:id/approve', roleMiddleware('admin'), approveReservation);
router.patch('/:id/reject', roleMiddleware('admin'), rejectReservation);
router.patch('/:id/cancel', cancelReservation);
router.delete('/:id', roleMiddleware('admin'), deleteReservation);

export default router;
