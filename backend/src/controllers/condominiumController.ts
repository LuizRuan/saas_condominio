import { Response } from 'express';
import Condominium from '../models/Condominium';
import { AuthRequest } from '../middlewares/auth';
import { errorDetails } from '../utils/errorDetails';

export const createCondominium = async (req: AuthRequest, res: Response): Promise<void> => {
  let condominiumId: string | undefined;

  try {
    if (req.user!.condominiumId) {
      res.status(409).json({ error: 'Usuário já possui um condomínio vinculado' });
      return;
    }

    if (!req.body.name?.trim()) {
      res.status(400).json({ error: 'Nome do condomínio é obrigatório' });
      return;
    }

    const condominium = await Condominium.create({
      name: req.body.name.trim(),
      cnpj: req.body.cnpj || '',
      address: req.body.address || '',
      city: req.body.city || '',
      state: req.body.state || '',
      pixKey: req.body.pixKey || '',
      defaultFee: req.body.defaultFee ?? 0,
      dueDay: req.body.dueDay ?? 10,
      ownerId: req.user!._id,
    });
    condominiumId = condominium.id;

    req.user!.condominiumId = condominium._id as any;
    await req.user!.save();

    res.status(201).json(condominium);
  } catch (error: any) {
    if (condominiumId) {
      await Condominium.findByIdAndDelete(condominiumId).catch(() => undefined);
    }
    res.status(500).json({ error: 'Erro ao criar condomínio', details: errorDetails(error) });
  }
};

export const getMyCondominium = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user!.condominiumId) {
      res.status(404).json({ error: 'Condomínio não vinculado ao usuário' });
      return;
    }

    const condominium = await Condominium.findById(req.user!.condominiumId).select('+pixKey');
    if (!condominium) {
      res.status(404).json({ error: 'Condomínio não encontrado' });
      return;
    }
    res.json(condominium);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar condomínio', details: errorDetails(error) });
  }
};

export const updateCondominium = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.body.name?.trim()) {
      res.status(400).json({ error: 'Nome do condomínio é obrigatório' });
      return;
    }

    if (!req.user!.condominiumId || req.user!.condominiumId.toString() !== id) {
      res.status(404).json({ error: 'Condomínio não encontrado' });
      return;
    }

    const updated = await Condominium.findOneAndUpdate(
      {
        _id: id,
        ownerId: req.user!._id,
      },
      {
        name: req.body.name.trim(),
        cnpj: req.body.cnpj || '',
        address: req.body.address || '',
        city: req.body.city || '',
        state: req.body.state || '',
        pixKey: req.body.pixKey || '',
        defaultFee: req.body.defaultFee ?? 0,
        dueDay: req.body.dueDay ?? 10,
      },
      { new: true, runValidators: true, select: '+pixKey' }
    );
    if (!updated) {
      res.status(404).json({ error: 'Condomínio não encontrado' });
      return;
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar condomínio', details: errorDetails(error) });
  }
};
