import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
router.get('/', roleMiddleware('admin'), getAuditLogs);

export default router;
