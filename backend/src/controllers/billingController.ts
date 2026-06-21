import { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import mongoose from 'mongoose';
import Condominium from '../models/Condominium';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middlewares/auth';
import { createPreapproval, getPreapproval, cancelPreapproval, MPApiError } from '../services/mercadopago';
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

  // Não reativar assinatura cancelada pelo usuário
  if (subscription.status === 'canceled') {
    console.log('[BILLING] Subscription cancelada localmente — webhook de reativação ignorado');
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

async function cancelLocalOnly(
  subscriptionId: mongoose.Types.ObjectId,
  condominiumId: mongoose.Types.ObjectId,
  rawStatus: string
): Promise<void> {
  await Subscription.updateOne(
    { _id: subscriptionId },
    { $set: { status: 'canceled', rawStatus } }
  );
  await Condominium.updateOne(
    { _id: condominiumId },
    { $set: { subscriptionStatus: 'canceled' } }
  );
}

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
      res.status(404).json({ error: 'Nenhuma assinatura em andamento encontrada.' });
      return;
    }

    const isPending = subscription.status === 'pending';
    const successMessage = isPending ? 'Solicitação cancelada com sucesso.' : 'Assinatura cancelada com sucesso.';

    // Caminho A: sem preapprovalId → cancelamento local (solicitação criada sem MP)
    if (!subscription.mercadoPagoPreapprovalId) {
      console.warn('[BILLING] Subscription sem preapprovalId — cancelamento local aplicado');
      await cancelLocalOnly(subscription._id, condominiumId, 'local_cancel');
      res.json({ success: true, message: successMessage });
      return;
    }

    // Caminho B/C: verificar estado no MP primeiro
    let mpPreapproval: any = null;
    try {
      mpPreapproval = await getPreapproval(subscription.mercadoPagoPreapprovalId);
    } catch (err: any) {
      if (err instanceof MPApiError && err.statusCode === 404) {
        // Preapproval não existe no MP (expirado/teste antigo) → cancelar localmente
        console.warn('[BILLING] Preapproval não encontrado no MP — cancelamento local');
        await cancelLocalOnly(subscription._id, condominiumId, 'not_found_mp');
        res.json({ success: true, message: successMessage });
        return;
      }
      console.error('[BILLING] Erro ao consultar MP:', err?.message);
      res.status(502).json({ error: 'Não foi possível consultar o Mercado Pago. Verifique os logs do servidor.' });
      return;
    }

    // Caminho C: preapproval existe no MP
    const currentMpStatus = String(mpPreapproval?.status ?? '');
    const alreadyCanceled = currentMpStatus === 'canceled' || currentMpStatus === 'cancelled';

    if (!alreadyCanceled) {
      try {
        await cancelPreapproval(subscription.mercadoPagoPreapprovalId);
      } catch (err: any) {
        console.error('[BILLING] Erro ao cancelar no MP:', err?.message);
        res.status(502).json({ error: 'Não foi possível cancelar no Mercado Pago. Verifique os logs do servidor.' });
        return;
      }

      let confirmed: any;
      try {
        confirmed = await getPreapproval(subscription.mercadoPagoPreapprovalId);
      } catch (err: any) {
        console.error('[BILLING] Erro ao confirmar cancelamento no MP:', err?.message);
        res.status(502).json({ error: 'Cancelamento enviado, mas não foi possível confirmar o status. Verifique os logs.' });
        return;
      }

      const confirmedStatus = String(confirmed?.status ?? '');
      if (confirmedStatus !== 'canceled' && confirmedStatus !== 'cancelled') {
        res.status(502).json({
          error: `Não foi possível confirmar o cancelamento no Mercado Pago (status: ${confirmedStatus}). Tente novamente.`,
        });
        return;
      }
    }

    await cancelLocalOnly(subscription._id, condominiumId, alreadyCanceled ? currentMpStatus : 'canceled');
    console.log(`[BILLING] Cancelamento concluído — condominiumId: ${condominiumId}`);
    res.json({ success: true, message: successMessage });
  } catch (error: any) {
    console.error('[BILLING] Erro inesperado ao cancelar:', error?.message);
    res.status(500).json({ error: 'Erro inesperado ao cancelar. Tente novamente.' });
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
