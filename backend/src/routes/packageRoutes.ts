import { Router } from 'express';
import {
  createPackage,
  getPackages,
  getResidentPackages,
  markAsDelivered,
  deletePackage,
} from '../controllers/packageController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();

// Routes for both admins and residents
router.use(authMiddleware);

// Resident routes
router.get('/resident', getResidentPackages);

// Admin routes
router.use(roleMiddleware('admin'));
router.post('/', createPackage);
router.get('/', getPackages);
router.patch('/:id/deliver', markAsDelivered);
router.delete('/:id', deletePackage);

export default router;
