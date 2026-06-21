import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, IUserDoc } from '../models/User';
import { getJwtSecret } from '../config/env';

export interface AuthRequest extends Request {
  user?: IUserDoc;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    const userId = typeof decoded.sub === 'string'
      ? decoded.sub
      : typeof decoded.id === 'string'
        ? decoded.id
        : null;

    if (!userId) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    // SEC-021: reject tokens issued before the last password change
    if (user.passwordChangedAt && decoded.iat) {
      const changedAtSecs = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAtSecs) {
        res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
        return;
      }
    }

    req.user = user;

    if (user.mustChangePassword === true) {
      const allowed = ['/api/auth/me', '/api/auth/change-password'];
      if (!allowed.some(p => req.originalUrl.startsWith(p))) {
        res.status(403).json({ error: 'Troca de senha obrigatória', mustChangePassword: true });
        return;
      }
    }

    if (user.isDemo === true && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      res.status(403).json({
        error: 'Modo demonstração: ações de edição estão desativadas.',
        isDemo: true,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
