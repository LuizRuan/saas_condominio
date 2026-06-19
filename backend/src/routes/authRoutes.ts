import { Router } from 'express';
import { acceptInvite, register, login, getMe, demoLogin } from '../controllers/authController';
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

export default router;
