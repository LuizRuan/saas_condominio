import { Router } from 'express';
import { getProfile, updateProfile, updatePassword } from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas de usuário exigem autenticação (morador ou admin)
router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', updatePassword);

export default router;
