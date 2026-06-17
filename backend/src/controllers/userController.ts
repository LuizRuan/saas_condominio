import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { audit } from '../utils/audit';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao buscar perfil', error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user!._id);
    
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    await audit(req, {
      action: 'profile_updated',
      entity: 'User',
      entityId: user._id as any,
      message: 'Perfil atualizado',
      metadata: { name: user.name, phone: user.phone }
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      condominiumId: user.condominiumId,
      unitId: user.unitId
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao atualizar perfil', error: error.message });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      res.status(400).json({ message: 'A nova senha é obrigatória' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    await audit(req, {
      action: 'password_updated',
      entity: 'User',
      entityId: user._id as any,
      message: 'Senha alterada pelo usuário'
    });

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao atualizar senha', error: error.message });
  }
};
