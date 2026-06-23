import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Resident from '../models/Resident';
import User from '../models/User';
import Unit from '../models/Unit';
import { AuthRequest } from '../middlewares/auth';
import { audit } from '../utils/audit';
import { errorDetails } from '../utils/errorDetails';
import { getPaginationParams } from '../utils/pagination';

export const createResident = async (req: AuthRequest, res: Response): Promise<void> => {
  let createdUserId: string | undefined;
  let createdResidentId: string | undefined;

  try {
    const { name, phone, email, unitId, type, isFinancialResponsible, createAccount, password } = req.body;
    const condominiumId = req.user!.condominiumId;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!condominiumId) {
      res.status(409).json({ error: 'Usuário sem condomínio vinculado' });
      return;
    }

    if (!name?.trim() || !unitId) {
      res.status(400).json({ error: 'Nome e unidade são obrigatórios' });
      return;
    }

    const unit = await Unit.findOne({ _id: unitId, condominiumId });
    if (!unit) {
      res.status(400).json({ error: 'Unidade inválida para este condomínio' });
      return;
    }

    let userId;

    if (createAccount) {
      if (!normalizedEmail) {
        res.status(400).json({ error: 'E-mail é obrigatório para criar a conta de acesso' });
        return;
      }
      if (!password || password.length < 6) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
        return;
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password || '123456', salt);

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone || '',
        role: 'resident',
        condominiumId,
        unitId: unit._id,
      });
      userId = user._id;
      createdUserId = user.id;
    }

    const resident = await Resident.create({
      condominiumId,
      unitId: unit._id,
      name: name.trim(),
      phone: phone || '',
      email: normalizedEmail,
      type: type || 'owner',
      isFinancialResponsible: Boolean(isFinancialResponsible),
      userId,
    });
    createdResidentId = resident.id;

    if (unit.status === 'empty') {
      unit.status = 'occupied';
      await unit.save();
    }

    res.status(201).json(resident);
  } catch (error: any) {
    if (createdResidentId) {
      await Resident.findByIdAndDelete(createdResidentId).catch(() => undefined);
    }
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId).catch(() => undefined);
    }
    res.status(500).json({ error: 'Erro ao cadastrar morador', details: errorDetails(error) });
  }
};

export const getResidents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const baseFilter: Record<string, any> = { condominiumId: req.user!.condominiumId };

    if (req.query.page) {
      const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);

      const filter: Record<string, any> = { ...baseFilter };
      const rawSearch = String(req.query.search ?? '').trim().slice(0, 80);
      if (rawSearch) {
        const esc = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(esc, 'i');
        filter.$or = [{ name: re }, { email: re }, { phone: re }];
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [data, paginationTotal, summaryTotal, financial, owners, tenants, monthlyNew] = await Promise.all([
        Resident.find(filter).populate('unitId', 'block number').sort({ name: 1 }).skip(skip).limit(limit),
        Resident.countDocuments(filter),
        Resident.countDocuments(baseFilter),
        Resident.countDocuments({ ...baseFilter, $or: [{ isFinancialResponsible: true }, { type: 'financial_responsible' }] }),
        Resident.countDocuments({ ...baseFilter, type: 'owner' }),
        Resident.countDocuments({ ...baseFilter, type: 'tenant' }),
        Resident.countDocuments({ ...baseFilter, createdAt: { $gte: startOfMonth } }),
      ]);

      res.json({
        data,
        pagination: { page, limit, total: paginationTotal, totalPages: Math.ceil(paginationTotal / limit) },
        summary: { total: summaryTotal, financial, owners, tenants, monthlyNew },
      });
    } else {
      const residents = await Resident.find(baseFilter).populate('unitId', 'block number').sort({ name: 1 });
      res.json(residents);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar moradores', details: errorDetails(error) });
  }
};

export const getResident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = await Resident.findOne({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    }).populate('unitId', 'block number');

    if (!resident) {
      res.status(404).json({ error: 'Morador não encontrado' });
      return;
    }
    res.json(resident);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar morador', details: errorDetails(error) });
  }
};

export const getMyResident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = await Resident.findOne({
      userId: req.user!._id,
      condominiumId: req.user!.condominiumId,
    }).populate('unitId', 'block number');

    if (!resident) {
      res.status(404).json({ error: 'Perfil de morador não encontrado' });
      return;
    }
    res.json(resident);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar perfil', details: errorDetails(error) });
  }
};

export const updateResident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const resident = await Resident.findOne({
      _id: req.params.id,
      condominiumId,
    });

    if (!resident) {
      res.status(404).json({ error: 'Morador não encontrado' });
      return;
    }

    const name = String(req.body.name || '').trim();
    const unitId = req.body.unitId;
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();

    if (!name || !unitId) {
      res.status(400).json({ error: 'Nome e unidade são obrigatórios' });
      return;
    }

    const unit = await Unit.findOne({ _id: unitId, condominiumId });
    if (!unit) {
      res.status(400).json({ error: 'Unidade inválida para este condomínio' });
      return;
    }

    const linkedUser = resident.userId
      ? await User.findOne({ _id: resident.userId, condominiumId, role: 'resident' })
      : null;

    if (linkedUser && !normalizedEmail) {
      res.status(400).json({ error: 'E-mail é obrigatório para moradores com acesso' });
      return;
    }

    if (linkedUser && normalizedEmail) {
      const emailInUse = await User.exists({
        email: normalizedEmail,
        _id: { $ne: linkedUser._id },
      });
      if (emailInUse) {
        res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
        return;
      }
    }

    const previousUnitId = resident.unitId;
    resident.name = name;
    resident.phone = req.body.phone || '';
    resident.email = normalizedEmail;
    resident.unitId = unit._id as any;
    resident.type = req.body.type || 'owner';
    resident.isFinancialResponsible = Boolean(req.body.isFinancialResponsible);
    await resident.save();

    if (linkedUser) {
      linkedUser.name = resident.name;
      linkedUser.phone = resident.phone;
      linkedUser.email = resident.email;
      linkedUser.unitId = resident.unitId;
      await linkedUser.save();
    }

    if (unit.status === 'empty') {
      unit.status = 'occupied';
      await unit.save();
    }

    if (previousUnitId.toString() !== unit.id) {
      const oldUnitStillOccupied = await Resident.exists({
        condominiumId,
        unitId: previousUnitId,
      });
      if (!oldUnitStillOccupied) {
        await Unit.updateOne(
          { _id: previousUnitId, condominiumId, status: 'occupied' },
          { status: 'empty' }
        );
      }
    }

    res.json(resident);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar morador', details: errorDetails(error) });
  }
};

export const deleteResident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = await Resident.findOneAndDelete({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    });
    if (!resident) {
      res.status(404).json({ error: 'Morador não encontrado' });
      return;
    }

    if (resident.userId) {
      await User.findOneAndDelete({
        _id: resident.userId,
        condominiumId: req.user!.condominiumId,
        role: 'resident',
      });
    }

    const unitStillOccupied = await Resident.exists({
      condominiumId: req.user!.condominiumId,
      unitId: resident.unitId,
    });
    if (!unitStillOccupied) {
      await Unit.updateOne(
        {
          _id: resident.unitId,
          condominiumId: req.user!.condominiumId,
          status: 'occupied',
        },
        { status: 'empty' }
      );
    }

    await audit(req, {
      action: 'delete',
      entity: 'resident',
      entityId: resident._id as any,
      message: `Morador ${resident.name} excluído`,
      metadata: {
        name: resident.name,
        unitId: String(resident.unitId),
        ...(resident.userId ? { cascadeUser: true } : {}),
      },
    });
    res.json({ message: 'Morador excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir morador', details: errorDetails(error) });
  }
};

export const createResidentInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = await Resident.findOne({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    }).populate('unitId', 'block number');

    if (!resident) {
      res.status(404).json({ error: 'Morador não encontrado' });
      return;
    }

    if (!resident.email) {
      res.status(400).json({ error: 'Cadastre um e-mail para gerar o convite' });
      return;
    }

    if (resident.userId) {
      res.status(409).json({ error: 'Morador já possui acesso vinculado' });
      return;
    }

    const existingUser = await User.findOne({ email: resident.email });
    if (existingUser) {
      res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
      return;
    }

    resident.inviteToken = crypto.randomBytes(24).toString('hex');
    resident.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await resident.save();

    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].replace(/\/+$/, '');
    const inviteUrl = `${baseUrl}/convite/${resident.inviteToken}`;
    const unit = resident.unitId as any;
    const unitLabel = unit?.number ? `${unit.block ? `Bloco ${unit.block} - ` : ''}Apt ${unit.number}` : 'sua unidade';
    const whatsappText = `Olá, ${resident.name}! Seu acesso ao Domus para ${unitLabel} está pronto. Crie sua senha pelo link: ${inviteUrl}`;

    await audit(req, {
      action: 'invite',
      entity: 'resident',
      entityId: resident._id as any,
      message: `Convite gerado para ${resident.name}`,
    });

    res.json({ inviteUrl, whatsappText, expiresAt: resident.inviteExpiresAt });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao gerar convite', details: errorDetails(error) });
  }
};
