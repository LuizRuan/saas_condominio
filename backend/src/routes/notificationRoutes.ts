import { Router } from 'express';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);
router.get('/', getNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;
