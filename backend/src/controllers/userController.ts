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
    // Allowlist only safe fields — prevent mass assignment of role/condominiumId etc.
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : undefined;
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : undefined;

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
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
      return;
    }

    // Load with password field (excluded by default via select: false pattern)
    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    // Verify current password before allowing any change
    // (prevents account takeover even if an attacker steals a valid JWT token)
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(401).json({ message: 'Senha atual incorreta' });
      return;
    }

    // SECURITY FIX: User model has NO pre-save hook — must hash manually
    // Previously this was: user.password = newPassword; // (stored in plain text!)
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
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
