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

// Staff routes (admin, subadmin, concierge)
const staffRoles = ['admin', 'subadmin', 'concierge'];
router.post('/', roleMiddleware(...staffRoles), createPackage);
router.get('/', roleMiddleware(...staffRoles), getPackages);
router.patch('/:id/deliver', roleMiddleware(...staffRoles), markAsDelivered);
router.delete('/:id', roleMiddleware('admin', 'subadmin', 'concierge'), deletePackage);

export default router;
