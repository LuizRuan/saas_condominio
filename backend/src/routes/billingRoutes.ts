import { Router } from 'express';
import { subscribe, webhookHandler } from '../controllers/billingController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Subscribe — requer admin autenticado
router.post('/mercadopago/subscribe', authMiddleware, subscribe);

// Webhook — público, sem auth (chamado pelo Mercado Pago)
router.post('/mercadopago/webhook', webhookHandler);

export default router;
