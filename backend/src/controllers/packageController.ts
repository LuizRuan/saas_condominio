import { Response } from 'express';
import Package from '../models/Package';
import Unit from '../models/Unit';
import Resident from '../models/Resident';
import { AuthRequest } from '../middlewares/auth';
import { notify } from '../utils/notifications';
import { audit } from '../utils/audit';
import { getPaginationParams } from '../utils/pagination';

export const createPackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unitId, description, trackingCode, notes } = req.body;

    const unit = await Unit.findOne({ _id: unitId, condominiumId: req.user!.condominiumId });
    if (!unit) {
      res.status(400).json({ message: 'Unidade inválida para este condomínio' });
      return;
    }

    const newPackage = await Package.create({
      condominiumId: req.user!.condominiumId,
      unitId,
      description,
      trackingCode,
      notes,
      receivedBy: req.user!._id,
    });

    // Auditoria
    await audit(req, {
      action: 'package_received',
      entity: 'Package',
      entityId: newPackage._id as any,
      message: 'Encomenda recebida',
      metadata: { packageId: newPackage._id }
    });

    // Notificar apenas os moradores da unidade que têm conta vinculada
    const unitResidents = await Resident.find({
      condominiumId: req.user!.condominiumId,
      unitId: unitId,
      userId: { $exists: true, $ne: null },
    }).select('userId');

    for (const resident of unitResidents) {
      await notify({
        condominiumId: req.user!.condominiumId!,
        userId: resident.userId as any,
        type: 'system',
        title: 'Encomenda Recebida',
        message: `Nova encomenda recebida: ${description}. Retire na portaria.`,
        link: '/morador/encomendas',
      });
    }

    res.status(201).json(newPackage);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao registrar encomenda', error: error.message });
  }
};

export const getPackages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const baseFilter: Record<string, any> = { condominiumId: req.user!.condominiumId };

    if (req.query.page) {
      const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);

      const filter: Record<string, any> = { ...baseFilter };
      const rawSearch = String(req.query.search ?? '').trim().slice(0, 80);
      if (rawSearch) {
        const esc = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(esc, 'i');
        filter.$or = [{ description: re }, { trackingCode: re }];
      }

      const [data, paginationTotal, summaryTotal, pending, delivered] = await Promise.all([
        Package.find(filter)
          .populate('unitId', 'block number')
          .populate('receivedBy', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Package.countDocuments(filter),
        Package.countDocuments(baseFilter),
        Package.countDocuments({ ...baseFilter, status: 'pending' }),
        Package.countDocuments({ ...baseFilter, status: 'delivered' }),
      ]);

      res.json({
        data,
        pagination: { page, limit, total: paginationTotal, totalPages: Math.ceil(paginationTotal / limit) },
        summary: { total: summaryTotal, pending, delivered },
      });
    } else {
      const packages = await Package.find(baseFilter)
        .populate('unitId', 'block number')
        .populate('receivedBy', 'name')
        .sort({ createdAt: -1 });
      res.json(packages);
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao buscar encomendas', error: error.message });
  }
};

export const getResidentPackages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user!.unitId) {
       res.status(400).json({ message: 'Usuário não está vinculado a uma unidade' });
       return;
    }
    const packages = await Package.find({ unitId: req.user!.unitId, condominiumId: req.user!.condominiumId })
      .sort({ createdAt: -1 });
    res.json(packages);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao buscar suas encomendas', error: error.message });
  }
};

export const markAsDelivered = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { deliveredTo } = req.body;

    const updatedPackage = await Package.findOneAndUpdate(
      { _id: id, condominiumId: req.user!.condominiumId },
      {
        status: 'delivered',
        deliveredAt: new Date(),
        deliveredTo
      },
      { new: true }
    );

    if (!updatedPackage) {
      res.status(404).json({ message: 'Encomenda não encontrada' });
      return;
    }

    await audit(req, {
      action: 'package_delivered',
      entity: 'Package',
      entityId: id as string,
      message: 'Encomenda entregue',
      metadata: { packageId: id, deliveredTo }
    });

    res.json(updatedPackage);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao dar baixa na encomenda', error: error.message });
  }
};

export const deletePackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pkg = await Package.findOneAndDelete({ _id: id, condominiumId: req.user!.condominiumId });
    if (!pkg) { res.status(404).json({ message: 'Encomenda não encontrada' }); return; }

    await audit(req, {
      action: 'delete',
      entity: 'package',
      entityId: pkg._id as any,
      message: 'Encomenda excluída',
      metadata: { description: pkg.description, status: pkg.status },
    });
    res.json({ message: 'Encomenda excluída com sucesso' });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao excluir encomenda', error: error.message });
  }
};
