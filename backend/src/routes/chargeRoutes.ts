import { Router } from 'express';
import {
  createCharge, createBulkCharges, getCharges, getCharge,
  updateCharge, markAsPaid, markAsPending, deleteCharge,
  submitPaymentProof, rejectPaymentProof, exportChargesCsv,
} from '../controllers/chargeController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
router.post('/', roleMiddleware('admin'), createCharge);
router.post('/bulk', roleMiddleware('admin'), createBulkCharges);
router.get('/reports/export.csv', roleMiddleware('admin'), exportChargesCsv);
router.get('/', getCharges);
router.get('/:id', getCharge);
router.put('/:id', roleMiddleware('admin'), updateCharge);
router.patch('/:id/mark-paid', roleMiddleware('admin'), markAsPaid);
router.patch('/:id/mark-pending', roleMiddleware('admin'), markAsPending);
router.patch('/:id/reject-proof', roleMiddleware('admin'), rejectPaymentProof);
router.post('/:id/proof', submitPaymentProof);
router.delete('/:id', roleMiddleware('admin'), deleteCharge);

export default router;
