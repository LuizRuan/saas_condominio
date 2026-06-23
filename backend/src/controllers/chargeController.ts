import { Response } from 'express';
import Charge from '../models/Charge';
import Unit from '../models/Unit';
import Resident from '../models/Resident';
import { AuthRequest } from '../middlewares/auth';
import { audit } from '../utils/audit';
import { syncOverdueCharges } from '../utils/charges';
import { notify } from '../utils/notifications';
import { requirePlan } from '../utils/planCheck';
import { errorDetails } from '../utils/errorDetails';
import { notDeleted } from '../utils/softDelete';

const isImageDataUrl = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('data:image/');

const csvCell = (value: unknown): string => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

export const createCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const { unitId, referenceMonth, amount, dueDate, description } = req.body;

    if (!unitId || !referenceMonth || amount === undefined || !dueDate) {
      res.status(400).json({ error: 'Unidade, mês, valor e vencimento são obrigatórios' });
      return;
    }

    const unit = await Unit.findOne({ _id: unitId, condominiumId });
    if (!unit) {
      res.status(400).json({ error: 'Unidade inválida para este condomínio' });
      return;
    }

    // Idempotência: evita cobrança duplicada para a mesma unidade/mês (ignora arquivadas).
    const existingCharge = await Charge.findOne({ condominiumId, unitId: unit._id, referenceMonth, ...notDeleted });
    if (existingCharge) {
      res.status(409).json({ error: 'Já existe cobrança para esta unidade neste mês de referência.' });
      return;
    }

    const resident = await Resident.findOne({
      condominiumId,
      unitId: unit._id,
      isFinancialResponsible: true,
    });

    const charge = await Charge.create({
      condominiumId,
      unitId: unit._id,
      residentId: resident?._id,
      referenceMonth,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      description: description || 'Taxa condominial',
      paymentHistory: [{
        status: 'pending',
        note: 'Cobrança criada',
        actorId: req.user!._id,
      }],
    });

    if (resident?.userId) {
      await notify({
        condominiumId: charge.condominiumId,
        userId: resident.userId,
        type: 'payment',
        title: 'Nova cobrança disponível',
        message: `${charge.description} de ${charge.referenceMonth}`,
        link: '/morador/cobrancas',
      });
    }

    await audit(req, {
      action: 'create',
      entity: 'charge',
      entityId: charge._id as any,
      message: `Cobrança criada para ${unit.block ? `Bloco ${unit.block} - ` : ''}Apt ${unit.number}`,
      metadata: { amount: charge.amount, referenceMonth: charge.referenceMonth },
    });

    res.status(201).json(charge);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar cobrança', details: errorDetails(error) });
  }
};

export const createBulkCharges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!(await requirePlan(req, res, ['pro', 'ultra'], 'Cobranças em lote estão disponíveis nos planos Pro e Ultra.'))) return;

    const { referenceMonth, amount, dueDate, description } = req.body;
    const condominiumId = req.user!.condominiumId;

    if (!referenceMonth || amount === undefined || !dueDate) {
      res.status(400).json({ error: 'Mês, valor e vencimento são obrigatórios' });
      return;
    }

    // Get all occupied units
    const units = await Unit.find({ condominiumId, status: { $ne: 'empty' } });

    if (units.length === 0) {
      res.status(400).json({ error: 'Nenhuma unidade ocupada encontrada' });
      return;
    }

    // Idempotência: não recriar cobranças de unidades que já têm uma neste mês (ignora arquivadas).
    const existing = await Charge.find({ condominiumId, referenceMonth, ...notDeleted }).select('unitId');
    const existingUnitIds = new Set(existing.map((c) => c.unitId.toString()));

    let skipped = 0;
    const charges = [];
    for (const unit of units) {
      if (existingUnitIds.has((unit._id as any).toString())) {
        skipped++;
        continue;
      }

      // Find financial responsible resident
      const resident = await Resident.findOne({
        condominiumId,
        unitId: unit._id,
        isFinancialResponsible: true,
      });

      charges.push({
        condominiumId,
        unitId: unit._id,
        residentId: resident?._id,
        referenceMonth,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        description: description || 'Taxa condominial',
        status: 'pending',
        paymentHistory: [{
          status: 'pending',
          note: 'Cobrança criada em massa',
          actorId: req.user!._id,
        }],
      });
    }

    const created = charges.length ? await Charge.insertMany(charges) : [];
    await audit(req, {
      action: 'bulk_create',
      entity: 'charge',
      message: `${created.length} cobranças criadas em massa${skipped ? `, ${skipped} já existiam e foram ignoradas` : ''}`,
      metadata: { amount: Number(amount), referenceMonth, created: created.length, skipped },
    });
    res.status(201).json({
      message: skipped
        ? `${created.length} cobranças criadas, ${skipped} já existiam e foram ignoradas.`
        : `${created.length} cobranças criadas`,
      created: created.length,
      skipped,
      charges: created,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar cobranças em massa', details: errorDetails(error) });
  }
};

export const getCharges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await syncOverdueCharges(req.user!.condominiumId!);

    const filter: any = { ...notDeleted };

    if (req.user!.role === 'admin') {
      filter.condominiumId = req.user!.condominiumId;
    } else {
      filter.condominiumId = req.user!.condominiumId;
      filter.unitId = req.user!.unitId;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.referenceMonth) filter.referenceMonth = req.query.referenceMonth;
    if (req.query.unitId && req.user!.role === 'admin') filter.unitId = req.query.unitId;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Charge.find(filter)
        .populate('unitId', 'block number')
        .populate('residentId', 'name phone email')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(limit),
      Charge.countDocuments(filter),
    ]);

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar cobranças', details: errorDetails(error) });
  }
};

export const getCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charge = await Charge.findOne({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
      ...(req.user!.role === 'resident' ? { unitId: req.user!.unitId } : {}),
      ...notDeleted,
    })
      .populate('unitId', 'block number')
      .populate('residentId', 'name phone email');

    if (!charge) {
      res.status(404).json({ error: 'Cobrança não encontrada' });
      return;
    }
    res.json(charge);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar cobrança', details: errorDetails(error) });
  }
};

export const updateCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unitId, referenceMonth, amount, dueDate, description, status } = req.body;
    const unit = unitId
      ? await Unit.findOne({ _id: unitId, condominiumId: req.user!.condominiumId })
      : null;

    if (unitId && !unit) {
      res.status(400).json({ error: 'Unidade inválida para este condomínio' });
      return;
    }

    const update: Record<string, unknown> = {};
    if (unit) {
      update.unitId = unit._id;
      const resident = await Resident.findOne({
        condominiumId: req.user!.condominiumId,
        unitId: unit._id,
        isFinancialResponsible: true,
      });
      update.residentId = resident?._id ?? null;
    }
    if (referenceMonth !== undefined) update.referenceMonth = referenceMonth;
    if (amount !== undefined) update.amount = Number(amount);
    if (dueDate !== undefined) update.dueDate = new Date(dueDate);
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;

    const charge = await Charge.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      update,
      { new: true, runValidators: true }
    );
    if (!charge) {
      res.status(404).json({ error: 'Cobrança não encontrada' });
      return;
    }
    res.json(charge);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar cobrança', details: errorDetails(error) });
  }
};

export const markAsPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charge = await Charge.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      {
        $set: {
          status: 'paid',
          paidAt: new Date(),
          proofStatus: req.body.fromProof ? 'approved' : 'none',
          proofReviewedAt: req.body.fromProof ? new Date() : undefined,
        },
        $push: {
          paymentHistory: {
            status: 'paid',
            note: req.body.fromProof ? 'Comprovante aprovado' : 'Marcado como pago',
            actorId: req.user!._id,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('unitId', 'block number').populate('residentId', 'name phone email userId');
    if (!charge) {
      res.status(404).json({ error: 'Cobrança não encontrada' });
      return;
    }

    const resident = typeof charge.residentId === 'object' ? charge.residentId as any : null;
    if (resident?.userId) {
      await notify({
        condominiumId: charge.condominiumId,
        userId: resident.userId,
        type: 'payment',
        title: 'Pagamento confirmado',
        message: `${charge.description} foi marcada como paga`,
        link: '/morador/cobrancas',
      });
    }

    await audit(req, {
      action: 'mark_paid',
      entity: 'charge',
      entityId: charge._id as any,
      message: `Cobrança ${charge.referenceMonth} marcada como paga`,
      metadata: { amount: charge.amount },
    });

    res.json(charge);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao marcar como pago', details: errorDetails(error) });
  }
};

export const markAsPending = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charge = await Charge.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      {
        $set: {
          status: 'pending',
          paidAt: null,
          proofStatus: 'none',
          proofReviewedAt: null,
        },
        $push: {
          paymentHistory: {
            status: 'pending',
            note: 'Marcado como pendente',
            actorId: req.user!._id,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!charge) {
      res.status(404).json({ error: 'Cobrança não encontrada' });
      return;
    }
    await audit(req, {
      action: 'mark_pending',
      entity: 'charge',
      entityId: charge._id as any,
      message: `Cobrança ${charge.referenceMonth} marcada como pendente`,
    });
    res.json(charge);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao marcar como pendente', details: errorDetails(error) });
  }
};

export const submitPaymentProof = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { proofUrl, proofNote } = req.body;
    if (!isImageDataUrl(proofUrl)) {
      res.status(400).json({ error: 'Envie uma imagem válida do comprovante' });
      return;
    }

    const charge = await Charge.findOneAndUpdate(
      {
        _id: req.params.id,
        condominiumId: req.user!.condominiumId,
        ...(req.user!.role === 'resident' ? { unitId: req.user!.unitId } : {}),
      },
      {
        $set: {
          proofUrl,
          proofNote: proofNote || '',
          proofStatus: 'submitted',
          proofSubmittedAt: new Date(),
        },
        $push: {
          paymentHistory: {
            status: 'proof_submitted',
            note: proofNote || 'Comprovante enviado',
            actorId: req.user!._id,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('unitId', 'block number').populate('residentId', 'name phone email');

    if (!charge) {
      res.status(404).json({ error: 'Cobrança não encontrada' });
      return;
    }

    await notify({
      condominiumId: charge.condominiumId,
      targetRole: 'admin',
      type: 'payment',
      title: `${req.user!.name} enviou um comprovante`,
      message: `${charge.description} • ${charge.referenceMonth}`,
      link: '/cobrancas',
    });

    await audit(req, {
      action: 'proof_submitted',
      entity: 'charge',
      entityId: charge._id as any,
      message: `Comprovante enviado para cobrança ${charge.referenceMonth}`,
    });

    res.json(charge);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao enviar comprovante', details: errorDetails(error) });
  }
};

export const rejectPaymentProof = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charge = await Charge.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      {
        $set: {
          proofStatus: 'rejected',
          proofReviewedAt: new Date(),
        },
        $push: {
          paymentHistory: {
            status: 'proof_rejected',
            note: req.body.note || 'Comprovante rejeitado',
            actorId: req.user!._id,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('residentId', 'name phone email userId');

    if (!charge) {
      res.status(404).json({ error: 'Cobrança não encontrada' });
      return;
    }

    const resident = typeof charge.residentId === 'object' ? charge.residentId as any : null;
    if (resident?.userId) {
      await notify({
        condominiumId: charge.condominiumId,
        userId: resident.userId,
        type: 'payment',
        title: 'Comprovante precisa de revisão',
        message: req.body.note || 'O síndico solicitou um novo comprovante',
        link: '/morador/cobrancas',
      });
    }

    await audit(req, {
      action: 'proof_rejected',
      entity: 'charge',
      entityId: charge._id as any,
      message: `Comprovante rejeitado para cobrança ${charge.referenceMonth}`,
    });

    res.json(charge);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao rejeitar comprovante', details: errorDetails(error) });
  }
};

export const exportChargesCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!(await requirePlan(req, res, ['pro', 'ultra'], 'A exportação de cobranças está disponível nos planos Pro e Ultra.'))) return;

    await syncOverdueCharges(req.user!.condominiumId!);
    const charges = await Charge.find({ condominiumId: req.user!.condominiumId, ...notDeleted })
      .populate('unitId', 'block number')
      .populate('residentId', 'name phone email')
      .sort({ dueDate: -1 });

    const rows = [
      ['Unidade', 'Morador', 'Email', 'Referência', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Comprovante'].map(csvCell).join(','),
      ...charges.map((charge) => {
        const resident = typeof charge.residentId === 'object' ? charge.residentId as any : null;
        return [
          (charge.unitId as any)?.number ? `${(charge.unitId as any).block ? `Bloco ${(charge.unitId as any).block} - ` : ''}Apt ${(charge.unitId as any).number}` : '',
          resident?.name || '',
          resident?.email || '',
          charge.referenceMonth,
          charge.description,
          charge.amount,
          charge.dueDate.toISOString().slice(0, 10),
          charge.status,
          charge.proofStatus,
        ].map(csvCell).join(',');
      }),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cobrancas.csv"');
    res.send(`\uFEFF${rows.join('\n')}`);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao exportar cobranças', details: errorDetails(error) });
  }
};

export const deleteCharge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charge = await Charge.findOne({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
      ...notDeleted,
    });
    if (!charge) {
      res.status(404).json({ error: 'Cobrança não encontrada' });
      return;
    }
    charge.deletedAt = new Date();
    charge.deletedBy = req.user!._id as any;
    await charge.save();
    await audit(req, {
      action: 'archive',
      entity: 'charge',
      entityId: charge._id as any,
      message: `Cobrança ${charge.referenceMonth} arquivada`,
      metadata: { amount: charge.amount },
    });
    res.json({ message: 'Cobrança excluída com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir cobrança', details: errorDetails(error) });
  }
};
