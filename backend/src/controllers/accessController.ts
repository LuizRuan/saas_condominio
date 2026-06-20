import { Request, Response } from 'express';
import Access from '../models/Access';
import { AuthRequest } from '../middleware/auth';

export const getAccesses = async (req: AuthRequest, res: Response) => {
  try {
    const { status, unitId } = req.query;
    const filter: any = { condominiumId: req.user?.condominiumId };

    if (status) filter.status = status;
    if (unitId) filter.unitId = unitId;

    const accesses = await Access.find(filter)
      .populate('unitId', 'block number')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(accesses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar acessos' });
  }
};

export const createAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { unitId, visitorName, documentType, documentNumber, type, vehiclePlate, notes } = req.body;

    const access = new Access({
      condominiumId: req.user?.condominiumId,
      unitId,
      visitorName,
      documentType,
      documentNumber,
      type,
      vehiclePlate,
      notes,
      createdBy: req.user?._id,
      status: 'active',
      entryTime: new Date()
    });

    await access.save();
    
    const populatedAccess = await access.populate('unitId', 'block number');
    res.status(201).json(populatedAccess);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar acesso' });
  }
};

export const finishAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const access = await Access.findOne({ _id: id, condominiumId: req.user?.condominiumId });
    
    if (!access) {
      return res.status(404).json({ error: 'Acesso não encontrado' });
    }

    if (access.status === 'finished') {
      return res.status(400).json({ error: 'Acesso já foi finalizado' });
    }

    access.status = 'finished';
    access.exitTime = new Date();
    await access.save();

    res.json(access);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao finalizar acesso' });
  }
};
