import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const demoGuard = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.isDemo === true && WRITE_METHODS.has(req.method)) {
    res.status(403).json({
      error: 'Modo demonstração: ações de edição estão desativadas.',
      isDemo: true,
    });
    return;
  }
  next();
};
