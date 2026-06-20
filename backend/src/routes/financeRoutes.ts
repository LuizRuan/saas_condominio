import { Router } from 'express';
import { getCashflow, getReport } from '../controllers/financeController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'subadmin', 'financial'));

router.get('/cashflow', getCashflow);
router.get('/reports', getReport);

export default router;
