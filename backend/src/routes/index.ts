import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import condominiumRoutes from './condominiumRoutes';
import unitRoutes from './unitRoutes';
import residentRoutes from './residentRoutes';
import chargeRoutes from './chargeRoutes';
import announcementRoutes from './announcementRoutes';
import issueRoutes from './issueRoutes';
import reservationRoutes from './reservationRoutes';
import dashboardRoutes from './dashboardRoutes';
import notificationRoutes from './notificationRoutes';
import auditRoutes from './auditRoutes';
import packageRoutes from './packageRoutes';
import userRoutes from './userRoutes';
import expenseRoutes from './expenseRoutes';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Condomínio em Dia API está online 🚀', timestamp: new Date().toISOString() });
});

// Routes
router.use('/auth', authRoutes);
router.use('/condominiums', condominiumRoutes);
router.use('/units', unitRoutes);
router.use('/residents', residentRoutes);
router.use('/charges', chargeRoutes);
router.use('/announcements', announcementRoutes);
router.use('/issues', issueRoutes);
router.use('/reservations', reservationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/packages', packageRoutes);
router.use('/users', userRoutes);
router.use('/expenses', expenseRoutes);

export default router;
