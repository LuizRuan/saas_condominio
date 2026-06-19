import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Condominium from '../models/Condominium';
import Resident from '../models/Resident';
import { AuthRequest } from '../middlewares/auth';
import { getJwtSecret } from '../config/env';
import { seedDemo } from '../utils/seed-demo';

const generateToken = (id: string): string => {
  return jwt.sign({}, getJwtSecret(), {
    subject: id,
    expiresIn: '30d',
  });
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  let createdUserId: string | undefined;
  let createdCondominiumId: string | undefined;

  try {
    // Cast all inputs to string to prevent NoSQL injection via object payloads
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const condominiumName = String(req.body.condominiumName || '').trim();
    const phone = String(req.body.phone || '');
    const city = String(req.body.city || '');
    const state = String(req.body.state || '');
    const pixKey = String(req.body.pixKey || '');
    const defaultFee = Number(req.body.defaultFee ?? 0);
    const dueDay = Number(req.body.dueDay ?? 10);

    if (!name || !email || !password || !condominiumName) {
      res.status(400).json({ error: 'Nome, e-mail, senha e condomínio são obrigatórios' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'Este e-mail já está cadastrado' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'admin',
    });
    createdUserId = user.id;

    const condominium = await Condominium.create({
      name: condominiumName,
      city,
      state,
      pixKey,
      defaultFee,
      dueDay,
      ownerId: user._id,
    });
    createdCondominiumId = condominium.id;

    user.condominiumId = condominium._id as any;
    await user.save();

    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        condominiumId: user.condominiumId,
      },
    });
  } catch (error: any) {
    if (createdCondominiumId) {
      await Condominium.findByIdAndDelete(createdCondominiumId).catch(() => undefined);
    }
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId).catch(() => undefined);
    }
    res.status(500).json({ error: 'Erro ao criar conta', details: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Cast to string to prevent NoSQL injection
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'E-mail ou senha incorretos' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'E-mail ou senha incorretos' });
      return;
    }

    if (!user.condominiumId) {
      res.status(409).json({ error: 'Usuário sem condomínio vinculado' });
      return;
    }

    if (user.role === 'resident' && !user.unitId) {
      res.status(409).json({ error: 'Morador sem unidade vinculada' });
      return;
    }

    const token = generateToken((user._id as any).toString());

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        condominiumId: user.condominiumId,
        unitId: user.unitId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao fazer login', details: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        condominiumId: user.condominiumId,
        unitId: user.unitId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar dados do usuário', details: error.message });
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Cast to string to prevent NoSQL injection via { "$gt": "" } payloads
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');

    if (!token || password.length < 6) {
      res.status(400).json({ error: 'Convite e senha de pelo menos 6 caracteres são obrigatórios' });
      return;
    }

    const resident = await Resident.findOne({
      inviteToken: token,
      inviteExpiresAt: { $gt: new Date() },
    });

    if (!resident) {
      res.status(404).json({ error: 'Convite inválido ou expirado' });
      return;
    }

    if (!resident.email) {
      res.status(400).json({ error: 'Morador sem e-mail cadastrado' });
      return;
    }

    if (resident.userId) {
      res.status(409).json({ error: 'Convite já utilizado' });
      return;
    }

    const existingUser = await User.findOne({ email: resident.email });
    if (existingUser) {
      res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: resident.name,
      email: resident.email,
      password: hashedPassword,
      phone: resident.phone || '',
      role: 'resident',
      condominiumId: resident.condominiumId,
      unitId: resident.unitId,
    });

    resident.userId = user._id as any;
    resident.inviteToken = '';
    resident.inviteExpiresAt = undefined;
    await resident.save();

    const authToken = generateToken((user._id as any).toString());
    res.json({
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        condominiumId: user.condominiumId,
        unitId: user.unitId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao aceitar convite', details: error.message });
  }
};

export const demoLogin = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const DEMO_EMAIL = 'sindicotest@gmail.com';

    // Se usuário demo não existe, roda o seed para criá-lo com todos os dados
    let demoUser = await User.findOne({ email: DEMO_EMAIL }).select('+password');
    if (!demoUser) {
      await seedDemo();
      demoUser = await User.findOne({ email: DEMO_EMAIL }).select('+password');
    }

    if (!demoUser) {
      res.status(500).json({ error: 'Não foi possível inicializar o ambiente de demonstração.' });
      return;
    }

    // Marcar como demo se ainda não estiver
    if (!demoUser.isDemo) {
      demoUser.isDemo = true;
      await demoUser.save();
    }

    const token = generateToken((demoUser._id as any).toString());

    res.json({
      token,
      isDemo: true,
      user: {
        id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        phone: demoUser.phone,
        role: demoUser.role,
        isDemo: true,
        condominiumId: demoUser.condominiumId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao iniciar demonstração', details: error.message });
  }
};
