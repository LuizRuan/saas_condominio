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

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
