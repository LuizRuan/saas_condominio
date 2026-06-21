import { Router } from 'express';
import { subscribe, webhookHandler, getBillingInfo, cancelSubscription } from '../controllers/billingController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Subscribe — requer admin autenticado
router.post('/mercadopago/subscribe', authMiddleware, subscribe);

// Webhook — público, sem auth (chamado pelo Mercado Pago)
router.post('/mercadopago/webhook', webhookHandler);

// Informações do plano atual — requer admin autenticado
router.get('/me', authMiddleware, getBillingInfo);

// Cancelar assinatura — requer admin autenticado
router.post('/mercadopago/cancel', authMiddleware, cancelSubscription);

export default router;
