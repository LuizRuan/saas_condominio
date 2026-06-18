import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';
import multer from 'multer';
import { parseFile, confirmImport } from '../controllers/importController';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Apenas PDF, Excel e CSV são permitidos.'));
    }
  }
});

// Aplica autenticação e verificação de admin em todas as rotas
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.post('/parse', upload.single('file'), parseFile);
router.post('/confirm', confirmImport);

export default router;
