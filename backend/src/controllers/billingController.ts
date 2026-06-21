import { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import Condominium from '../models/Condominium';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middlewares/auth';
import { createPreapproval, getPreapproval, cancelPreapproval } from '../services/mercadopago';
import { getMercadoPagoWebhookSecret } from '../config/env';

const PRICES = {
  pro:   { monthly: 97.00,   yearly: 931.20  },
  ultra: { monthly: 197.00,  yearly: 1891.20 },
} as const;

// ─── Subscribe ───────────────────────────────────────────────────────────────

export const subscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Apenas o síndico pode criar assinaturas' });
      return;
    }

    if (req.user.isDemo) {
      res.status(403).json({ error: 'Modo demonstração: não é possível criar assinaturas.', isDemo: true });
      return;
    }

    const plan = String(req.body.plan ?? '');
    const billingCycle = String(req.body.billingCycle ?? '');

    if (plan !== 'pro' && plan !== 'ultra') {
      res.status(400).json({ error: 'Plano inválido. Use: pro ou ultra' });
      return;
    }

    if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
      res.status(400).json({ error: 'Ciclo inválido. Use: monthly ou yearly' });
      return;
    }

    const condominiumId = req.user.condominiumId;
    if (!condominiumId) {
      res.status(400).json({ error: 'Usuário sem condomínio vinculado' });
      return;
    }

    const existing = await Subscription.findOne({
      condominiumId,
      status: { $in: ['active', 'pending', 'overdue'] },
    });
    if (existing) {
      res.status(409).json({
        error: 'Você já possui uma assinatura em andamento. Cancele ou aguarde a confirmação antes de contratar outra.',
      });
      return;
    }

    const amount = PRICES[plan as 'pro' | 'ultra'][billingCycle as 'monthly' | 'yearly'];
    const frequency = billingCycle === 'yearly' ? 12 : 1;
    const planLabel = plan === 'pro' ? 'Pro' : 'Ultra';
    const cycleLabel = billingCycle === 'yearly' ? 'Anual' : 'Mensal';
    const externalReference = `condo_${condominiumId}_${Date.now()}`;

    const allowedOrigins = (process.env.CLIENT_URL ?? '').split(',');
    const frontendBase = allowedOrigins[0]?.trim().replace(/\/+$/, '') || 'http://localhost:5173';
    const backUrl = process.env.MERCADO_PAGO_PENDING_URL || `${frontendBase}/billing/pending`;

    const preapproval = await createPreapproval({
      reason: `Domus — Plano ${planLabel} (${cycleLabel})`,
      auto_recurring: {
        frequency,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: 'BRL',
      },
      back_url: backUrl,
      payer_email: req.user.email,
      external_reference: externalReference,
      status: 'pending',
    });

    const checkoutUrl = preapproval.sandbox_init_point || preapproval.init_point;

    await Subscription.create({
      condominiumId,
      userId: req.user._id,
      gateway: 'mercadopago',
      plan,
      billingCycle,
      amount,
      currency: 'BRL',
      status: 'pending',
      mercadoPagoPreapprovalId: preapproval.id,
      externalReference,
      initPoint: checkoutUrl,
      rawStatus: preapproval.status,
    });

    res.json({ checkoutUrl });
  } catch (error: any) {
    console.error('[BILLING] Erro ao criar assinatura:', error?.message ?? 'desconhecido');
    res.status(500).json({ error: 'Erro ao criar assinatura. Tente novamente.' });
  }
};

// ─── Webhook Signature Validation ────────────────────────────────────────────

function validateWebhookSignature(
  signatureHeader: string,
  xRequestId: string | undefined,
  dataId: string,
  secret: string
): boolean {
  try {
    const parts: Record<string, string> = {};
    for (const part of signatureHeader.split(',')) {
      const idx = part.indexOf('=');
      if (idx > 0) {
        parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
      }
    }
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) return false;

    let manifest = `id:${dataId};`;
    if (xRequestId) manifest += `request-id:${xRequestId};`;
    manifest += `ts:${ts};`;

    const expected = createHmac('sha256', secret).update(manifest).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(v1, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

// ─── Webhook Async Processor ─────────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  authorized: 'active',
  pending:    'pending',
  paused:     'overdue',
  cancelled:  'canceled',
  expired:    'failed',
};

async function processWebhookAsync(
  body: any,
  signatureHeader: string,
  xRequestId: string | undefined
): Promise<void> {
  const type = String(body?.type ?? '');
  const dataId = String(body?.data?.id ?? '');

  console.log(`[BILLING] Webhook recebido — type: ${type}, data.id: ${dataId}`);

  if (!type || !dataId) {
    console.log('[BILLING] Webhook ignorado: type ou data.id ausentes');
    return;
  }

  const secret = getMercadoPagoWebhookSecret();
  if (!secret) {
    console.warn('[BILLING] MERCADO_PAGO_WEBHOOK_SECRET não configurado — ativação de plano abortada');
    return;
  }

  if (!signatureHeader) {
    console.warn('[BILLING] Webhook sem x-signature — ativação abortada');
    return;
  }

  const valid = validateWebhookSignature(signatureHeader, xRequestId, dataId, secret);
  if (!valid) {
    console.warn('[BILLING] Assinatura inválida — webhook ignorado');
    return;
  }

  if (type !== 'subscription_preapproval') {
    console.log(`[BILLING] Tipo "${type}" ignorado`);
    return;
  }

  const preapproval = await getPreapproval(dataId);
  const mpStatus = String(preapproval.status ?? '');
  const extRef = String(preapproval.external_reference ?? '');

  console.log(`[BILLING] Preapproval consultado — status: ${mpStatus}`);

  let subscription = await Subscription.findOne({ mercadoPagoPreapprovalId: dataId });
  if (!subscription && extRef) {
    subscription = await Subscription.findOne({ externalReference: extRef });
  }

  if (!subscription) {
    console.warn('[BILLING] Subscription local não encontrada — abortando');
    return;
  }

  // Idempotência: já ativo e MP confirma authorized → sem alteração
  if (subscription.status === 'active' && mpStatus === 'authorized') {
    console.log('[BILLING] Já ativo — sem alteração (idempotente)');
    return;
  }

  const localStatus = STATUS_MAP[mpStatus] ?? subscription.status;

  const nextPaymentDate = preapproval?.summarized?.next_payment_date;
  const currentPeriodEnd = nextPaymentDate ? new Date(nextPaymentDate) : undefined;

  await Subscription.updateOne(
    { _id: subscription._id },
    {
      $set: {
        status: localStatus,
        rawStatus: mpStatus,
        mercadoPagoPreapprovalId: dataId,
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      },
    }
  );

  if (localStatus === 'active') {
    await Condominium.updateOne(
      { _id: subscription.condominiumId },
      {
        $set: {
          plan: subscription.plan,
          subscriptionStatus: 'active',
          billingCycle: subscription.billingCycle,
          gateway: 'mercadopago',
          gatewaySubscriptionId: dataId,
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        },
      }
    );
    console.log(`[BILLING] Plano ${subscription.plan} ativado — condominiumId: ${subscription.condominiumId}`);
    return;
  }

  if (localStatus === 'canceled' || localStatus === 'failed') {
    await Condominium.updateOne(
      { _id: subscription.condominiumId },
      { $set: { subscriptionStatus: localStatus } }
    );
    console.log(`[BILLING] subscriptionStatus → ${localStatus} (plano mantido)`);
  }
}

// ─── Get Billing Info ────────────────────────────────────────────────────────

export const getBillingInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Não autenticado' }); return; }
    if (req.user.role !== 'admin') { res.status(403).json({ error: 'Acesso restrito ao síndico' }); return; }

    const condominiumId = req.user.condominiumId;
    if (!condominiumId) { res.status(400).json({ error: 'Usuário sem condomínio vinculado' }); return; }

    const condo = await Condominium.findById(condominiumId)
      .select('plan subscriptionStatus billingCycle currentPeriodEnd gateway');
    if (!condo) { res.status(404).json({ error: 'Condomínio não encontrado' }); return; }

    const subscription = await Subscription.findOne({
      condominiumId,
      status: { $in: ['active', 'pending', 'overdue'] },
    }).sort({ createdAt: -1 });

    res.json({
      plan: condo.plan ?? 'free',
      subscriptionStatus: condo.subscriptionStatus ?? null,
      billingCycle: condo.billingCycle ?? null,
      currentPeriodEnd: condo.currentPeriodEnd ?? null,
      gateway: condo.gateway ?? null,
      subscription: subscription
        ? {
            status: subscription.status,
            plan: subscription.plan,
            billingCycle: subscription.billingCycle,
            amount: subscription.amount,
            currentPeriodEnd: subscription.currentPeriodEnd ?? null,
            rawStatus: subscription.rawStatus ?? null,
            createdAt: subscription.createdAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error('[BILLING] Erro ao buscar info de assinatura:', error?.message);
    res.status(500).json({ error: 'Erro ao buscar informações de assinatura.' });
  }
};

// ─── Cancel Subscription ─────────────────────────────────────────────────────

export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Não autenticado' }); return; }
    if (req.user.role !== 'admin') { res.status(403).json({ error: 'Apenas o síndico pode cancelar assinaturas' }); return; }
    if (req.user.isDemo) { res.status(403).json({ error: 'Modo demonstração: não é possível cancelar assinaturas.', isDemo: true }); return; }

    const condominiumId = req.user.condominiumId;
    if (!condominiumId) { res.status(400).json({ error: 'Usuário sem condomínio vinculado' }); return; }

    const subscription = await Subscription.findOne({
      condominiumId,
      status: { $in: ['active', 'pending', 'overdue'] },
    });
    if (!subscription) {
      res.status(404).json({ error: 'Nenhuma assinatura ativa encontrada.' });
      return;
    }

    if (!subscription.mercadoPagoPreapprovalId) {
      res.status(400).json({ error: 'ID de preapproval do Mercado Pago não encontrado.' });
      return;
    }

    await cancelPreapproval(subscription.mercadoPagoPreapprovalId);

    const confirmed = await getPreapproval(subscription.mercadoPagoPreapprovalId);
    const mpStatus = String(confirmed.status ?? '');
    const isConfirmedCanceled = mpStatus === 'canceled' || mpStatus === 'cancelled';

    if (!isConfirmedCanceled) {
      res.status(502).json({
        error: `Falha ao cancelar no Mercado Pago. Status atual: ${mpStatus}. Tente novamente.`,
      });
      return;
    }

    await Subscription.updateOne(
      { _id: subscription._id },
      { $set: { status: 'canceled', rawStatus: mpStatus } }
    );

    await Condominium.updateOne(
      { _id: condominiumId },
      { $set: { subscriptionStatus: 'canceled' } }
    );

    console.log(`[BILLING] Assinatura cancelada — condominiumId: ${condominiumId}`);
    res.json({ success: true, message: 'Assinatura cancelada com sucesso.' });
  } catch (error: any) {
    console.error('[BILLING] Erro ao cancelar assinatura:', error?.message);
    res.status(500).json({ error: 'Erro ao cancelar assinatura. Tente novamente.' });
  }
};

// ─── Webhook Handler ─────────────────────────────────────────────────────────

export const webhookHandler = (req: Request, res: Response): void => {
  res.sendStatus(200);
  const signatureHeader = String(req.headers['x-signature'] ?? '');
  const xRequestId = req.headers['x-request-id']
    ? String(req.headers['x-request-id'])
    : undefined;
  processWebhookAsync(req.body, signatureHeader, xRequestId).catch((err: any) => {
    console.error('[BILLING] Erro no processamento assíncrono:', err?.message ?? 'desconhecido');
  });
};
