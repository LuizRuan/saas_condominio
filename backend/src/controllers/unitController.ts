import { Response } from 'express';
import Unit from '../models/Unit';
import Resident from '../models/Resident';
import Charge from '../models/Charge';
import Issue from '../models/Issue';
import Reservation from '../models/Reservation';
import Condominium from '../models/Condominium';
import { getEffectivePlan } from '../utils/planCheck';
import { AuthRequest } from '../middlewares/auth';
import { audit } from '../utils/audit';
import { errorDetails } from '../utils/errorDetails';
import { getPaginationParams } from '../utils/pagination';

const PLAN_UNIT_LIMITS: Record<string, number> = { free: 20, pro: 100, ultra: Infinity };

export const createUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user!.condominiumId) {
      res.status(409).json({ error: 'Usuário sem condomínio vinculado' });
      return;
    }

    if (!req.body.number?.trim()) {
      res.status(400).json({ error: 'Número da unidade é obrigatório' });
      return;
    }

    const condo = await Condominium.findById(req.user!.condominiumId).select('plan subscriptionStatus');
    const plan = getEffectivePlan(condo);
    const limit = PLAN_UNIT_LIMITS[plan] ?? 20;
    if (isFinite(limit)) {
      const count = await Unit.countDocuments({ condominiumId: req.user!.condominiumId });
      if (count >= limit) {
        const msg = plan === 'free'
          ? 'O plano Grátis permite até 20 unidades. Faça upgrade para o Pro ou Ultra para continuar.'
          : 'O plano Pro permite até 100 unidades. Para adicionar mais unidades, faça upgrade para o Ultra.';
        res.status(403).json({ error: msg });
        return;
      }
    }

    const unit = await Unit.create({
      block: req.body.block || '',
      number: req.body.number.trim(),
      status: req.body.status || 'empty',
      notes: req.body.notes || '',
      condominiumId: req.user!.condominiumId,
    });
    res.status(201).json(unit);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar unidade', details: errorDetails(error) });
  }
};

export const getUnits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const baseFilter: Record<string, any> = { condominiumId: req.user!.condominiumId };

    if (req.query.page) {
      const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);

      const filter: Record<string, any> = { ...baseFilter };
      const rawSearch = String(req.query.search ?? '').trim().slice(0, 80);
      if (rawSearch) {
        const esc = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(esc, 'i');
        filter.$or = [{ block: re }, { number: re }, { notes: re }];
      }

      const [data, paginationTotal, summaryTotal, occupied, empty, late] = await Promise.all([
        Unit.find(filter).sort({ block: 1, number: 1 }).skip(skip).limit(limit),
        Unit.countDocuments(filter),
        Unit.countDocuments(baseFilter),
        Unit.countDocuments({ ...baseFilter, status: 'occupied' }),
        Unit.countDocuments({ ...baseFilter, status: 'empty' }),
        Unit.countDocuments({ ...baseFilter, status: 'late' }),
      ]);

      res.json({
        data,
        pagination: { page, limit, total: paginationTotal, totalPages: Math.ceil(paginationTotal / limit) },
        summary: { total: summaryTotal, occupied, empty, late },
      });
    } else {
      const units = await Unit.find(baseFilter).sort({ block: 1, number: 1 });
      res.json(units);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar unidades', details: errorDetails(error) });
  }
};

export const getUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestedUnitId = req.user!.role === 'resident'
      ? req.user!.unitId
      : req.params.id;
    const unit = await Unit.findOne({
      _id: requestedUnitId,
      condominiumId: req.user!.condominiumId,
    });
    if (!unit) {
      res.status(404).json({ error: 'Unidade não encontrada' });
      return;
    }
    res.json(unit);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar unidade', details: errorDetails(error) });
  }
};

export const updateUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.body.number?.trim()) {
      res.status(400).json({ error: 'Número da unidade é obrigatório' });
      return;
    }

    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      {
        block: req.body.block || '',
        number: req.body.number.trim(),
        status: req.body.status || 'empty',
        notes: req.body.notes || '',
      },
      { new: true, runValidators: true }
    );
    if (!unit) {
      res.status(404).json({ error: 'Unidade não encontrada' });
      return;
    }
    res.json(unit);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar unidade', details: errorDetails(error) });
  }
};

export const deleteUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter = {
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    };
    const unit = await Unit.findOne(filter);
    if (!unit) {
      res.status(404).json({ error: 'Unidade não encontrada' });
      return;
    }

    const [hasResidents, hasCharges, hasIssues, hasReservations] = await Promise.all([
      Resident.exists({ condominiumId: req.user!.condominiumId, unitId: unit._id }),
      Charge.exists({ condominiumId: req.user!.condominiumId, unitId: unit._id }),
      Issue.exists({ condominiumId: req.user!.condominiumId, unitId: unit._id }),
      Reservation.exists({ condominiumId: req.user!.condominiumId, unitId: unit._id }),
    ]);

    if (hasResidents || hasCharges || hasIssues || hasReservations) {
      res.status(409).json({ error: 'Unidade possui registros vinculados e não pode ser excluída' });
      return;
    }

    await Unit.deleteOne(filter);
    await audit(req, {
      action: 'delete',
      entity: 'unit',
      entityId: unit._id as any,
      message: `Unidade ${unit.block ? `Bloco ${unit.block} - ` : ''}Apt ${unit.number} excluída`,
      metadata: { block: unit.block, number: unit.number },
    });
    res.json({ message: 'Unidade excluída com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir unidade', details: errorDetails(error) });
  }
};
