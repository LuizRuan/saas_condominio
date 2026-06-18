import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';
import multer from 'multer';
import { parseFile, confirmImport } from '../controllers/importController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Aplica autenticação e verificação de admin em todas as rotas
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.post('/parse', upload.single('file'), parseFile);
router.post('/confirm', confirmImport);

export default router;
