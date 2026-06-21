import { Response } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middlewares/auth';
import { errorDetails } from '../utils/errorDetails';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await AuditLog.find({ condominiumId: req.user!.condominiumId })
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit || 50));

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar histórico', details: errorDetails(error) });
  }
};
