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
router.post('/', roleMiddleware('admin', 'subadmin', 'financial'), createCharge);
router.post('/bulk', roleMiddleware('admin', 'subadmin', 'financial'), createBulkCharges);
router.get('/reports/export.csv', roleMiddleware('admin', 'subadmin', 'financial'), exportChargesCsv);
router.get('/', getCharges);
router.get('/:id', getCharge);
router.put('/:id', roleMiddleware('admin', 'subadmin', 'financial'), updateCharge);
router.patch('/:id/mark-paid', roleMiddleware('admin', 'subadmin', 'financial'), markAsPaid);
router.patch('/:id/mark-pending', roleMiddleware('admin', 'subadmin', 'financial'), markAsPending);
router.patch('/:id/reject-proof', roleMiddleware('admin', 'subadmin', 'financial'), rejectPaymentProof);
router.post('/:id/proof', submitPaymentProof);
router.delete('/:id', roleMiddleware('admin', 'subadmin', 'financial'), deleteCharge);

export default router;
