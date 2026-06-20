import { Router } from 'express';
import { acceptInvite, register, login, getMe, demoLogin, inviteStaff, acceptStaffInvite, getStaff, removeStaff, changePassword } from '../controllers/authController';
import { forgotPassword, resetPassword } from '../controllers/passwordController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/accept-invite', acceptInvite);
router.get('/me', authMiddleware, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/demo', demoLogin);

// Password change (authenticated)
router.post('/change-password', authMiddleware, changePassword);

// Staff (collaborators) routes
router.post('/invite-staff', authMiddleware, inviteStaff);
router.post('/accept-staff-invite/:token', acceptStaffInvite);
router.get('/staff', authMiddleware, getStaff);
router.delete('/staff/:id', authMiddleware, removeStaff);

export default router;
