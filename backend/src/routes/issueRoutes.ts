import { Router } from 'express';
import { addIssueMessage, createIssue, deleteIssue, getIssues, getIssue, updateIssue, updateIssueStatus } from '../controllers/issueController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

router.use(authMiddleware);
router.post('/', createIssue);
router.get('/', getIssues);
router.get('/:id', getIssue);
router.put('/:id', roleMiddleware('admin'), updateIssue);
router.patch('/:id/status', roleMiddleware('admin'), updateIssueStatus);
router.post('/:id/messages', addIssueMessage);
router.delete('/:id', roleMiddleware('admin', 'subadmin', 'concierge'), deleteIssue);

export default router;
