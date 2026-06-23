import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User';
import Condominium from '../models/Condominium';
import Unit from '../models/Unit';
import Resident from '../models/Resident';
import { AuthRequest } from '../middlewares/auth';
import { getJwtSecret } from '../config/env';
import { seedDemo } from '../utils/seed-demo';
import { errorDetails } from '../utils/errorDetails';
import { getEffectivePlan } from '../utils/planCheck';

// Pre-computed hash used only for timing-safe login (dummy bcrypt when email not found)
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('_dummy_not_used_', 10);

const generateToken = (id: string): string => {
  return jwt.sign({}, getJwtSecret(), {
    subject: id,
    expiresIn: '7d',
    algorithm: 'HS256',
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
      res.status(409).json({ error: 'Não foi possível concluir o cadastro com os dados informados.' });
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
        isDemo: user.isDemo,
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
    res.status(500).json({ error: 'Erro ao criar conta', details: errorDetails(error) });
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
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH); // SEC-013: equalize response time
      res.status(401).json({ error: 'E-mail ou senha inválidos' });
      return;
    }

    // SEC-028: check account lockout before comparing password
    if (user.lockUntil && user.lockUntil > new Date()) {
      res.status(401).json({ error: 'Muitas tentativas. Tente novamente mais tarde.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // SEC-028: increment failed attempts, lock after 5 failures (15 min)
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      if (attempts >= 5) {
        await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts, lockUntil: new Date(Date.now() + 15 * 60 * 1000) } });
      } else {
        await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts } });
      }
      res.status(401).json({ error: 'E-mail ou senha inválidos' });
      return;
    }

    // SEC-028: clear lockout on successful login
    if ((user.failedLoginAttempts ?? 0) > 0 || user.lockUntil) {
      await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: '' } });
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
        isDemo: user.isDemo,
        mustChangePassword: user.mustChangePassword ?? false,
        condominiumId: user.condominiumId,
        unitId: user.unitId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao fazer login', details: errorDetails(error) });
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

    const condo = user.condominiumId
      ? await Condominium.findById(user.condominiumId).select('plan subscriptionStatus')
      : null;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isDemo: user.isDemo,
        mustChangePassword: user.mustChangePassword ?? false,
        condominiumId: user.condominiumId,
        unitId: user.unitId,
        plan: user.isDemo ? 'ultra' : getEffectivePlan(condo),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar dados do usuário', details: errorDetails(error) });
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
    }).select('+inviteToken +inviteExpiresAt');

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
        isDemo: user.isDemo,
        condominiumId: user.condominiumId,
        unitId: user.unitId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao aceitar convite', details: errorDetails(error) });
  }
};

const STAFF_ROLES = ['concierge', 'financial', 'subadmin'] as const;
type StaffRole = typeof STAFF_ROLES[number];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com', 'icloud.com', 'outlook.com', 'hotmail.com',
  'yahoo.com', 'yahoo.com.br', 'live.com', 'msn.com',
  'proton.me', 'protonmail.com',
]);

export const inviteStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Apenas o síndico pode convidar colaboradores' });
      return;
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const role = String(req.body.role || '') as StaffRole;
    const name = String(req.body.name || '').trim() || email.split('@')[0];

    if (!email) {
      res.status(400).json({ error: 'E-mail é obrigatório' });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Digite um e-mail válido. Exemplo: nome@gmail.com' });
      return;
    }

    const domain = email.split('@')[1];
    if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
      res.status(400).json({ error: 'Use um e-mail válido com domínio conhecido, como gmail.com, icloud.com, outlook.com ou hotmail.com.' });
      return;
    }

    if (!STAFF_ROLES.includes(role)) {
      res.status(400).json({ error: 'Cargo inválido. Use: concierge, financial ou subadmin' });
      return;
    }

    // Token de convite seguro: guarda-se apenas o hash; o token cru vai uma única
    // vez no link de convite. O colaborador define a própria senha em /convite-staff/:token.
    const rawInviteToken = crypto.randomBytes(24).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Senha placeholder aleatória e inutilizável até o convite ser aceito.
    const salt = await bcrypt.genSalt(10);
    const placeholderPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), salt);

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.condominiumId?.toString() !== req.user.condominiumId?.toString()) {
        res.status(409).json({ error: 'Este e-mail já está em uso em outro condomínio' });
        return;
      }
      await User.updateOne({ _id: existing._id }, {
        $set: {
          role,
          password: placeholderPassword,
          mustChangePassword: false,
          condominiumId: req.user.condominiumId,
          staffInviteToken: inviteTokenHash,
          staffInviteTokenExpiry: inviteExpiry,
        },
      });
    } else {
      await User.create({
        name,
        email,
        password: placeholderPassword,
        phone: '',
        role,
        condominiumId: req.user.condominiumId,
        mustChangePassword: false,
        staffInviteToken: inviteTokenHash,
        staffInviteTokenExpiry: inviteExpiry,
      });
    }

    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].replace(/\/+$/, '');
    const inviteLink = `${baseUrl}/convite-staff/${rawInviteToken}`;

    res.json({ email, role, inviteLink });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao adicionar colaborador', details: errorDetails(error) });
  }
};

export const acceptStaffInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = String(req.params.token || '');
    const password = String(req.body.password || '');

    if (!token || password.length < 6) {
      res.status(400).json({ error: 'Token e senha de pelo menos 6 caracteres são obrigatórios' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const staffUser = await User.findOne({ staffInviteToken: tokenHash }).select('+staffInviteToken +staffInviteTokenExpiry');

    if (!staffUser || !staffUser.staffInviteTokenExpiry || staffUser.staffInviteTokenExpiry < new Date()) {
      res.status(404).json({ error: 'Convite inválido ou expirado' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    staffUser.password = hashedPassword;
    staffUser.staffInviteToken = undefined;
    staffUser.staffInviteTokenExpiry = undefined;
    await staffUser.save();

    const authToken = generateToken((staffUser._id as any).toString());
    res.json({
      token: authToken,
      user: {
        id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        phone: staffUser.phone,
        role: staffUser.role,
        isDemo: staffUser.isDemo,
        condominiumId: staffUser.condominiumId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao aceitar convite', details: errorDetails(error) });
  }
};

export const getStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    const staff = await User.find({
      condominiumId: req.user.condominiumId,
      role: { $in: STAFF_ROLES },
    }).select('name email role createdAt').lean();

    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar colaboradores', details: errorDetails(error) });
  }
};

export const removeStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    const staffUser = await User.findOne({
      _id: req.params.id,
      condominiumId: req.user.condominiumId,
      role: { $in: STAFF_ROLES },
    });

    if (!staffUser) {
      res.status(404).json({ error: 'Colaborador não encontrado' });
      return;
    }

    await staffUser.deleteOne();
    res.json({ message: 'Colaborador removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao remover colaborador', details: errorDetails(error) });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const newPassword = String(req.body.newPassword || '');

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
      return;
    }

    if (newPassword === '123456') {
      res.status(400).json({ error: 'Escolha uma senha diferente da senha inicial' });
      return;
    }

    if (!req.user.mustChangePassword) {
      const currentPassword = String(req.body.currentPassword || '');
      if (!currentPassword) {
        res.status(400).json({ error: 'A senha atual é obrigatória' });
        return;
      }
      const userWithPwd = await User.findById(req.user._id).select('+password');
      if (!userWithPwd) {
        res.status(401).json({ error: 'Usuário não encontrado' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, userWithPwd.password);
      if (!isMatch) {
        res.status(401).json({ error: 'Senha atual incorreta' });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne({ _id: req.user._id }, {
      $set: { password: hashedPassword, mustChangePassword: false, passwordChangedAt: new Date() },
    });

    res.json({ message: 'Senha alterada com sucesso', mustChangePassword: false });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao alterar senha', details: errorDetails(error) });
  }
};

export const demoLogin = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const DEMO_EMAIL = 'sindicotest@gmail.com';

    let demoUser = await User.findOne({ email: DEMO_EMAIL });
    let needsSeed = false;

    if (!demoUser) {
      needsSeed = true;
    } else if (!demoUser.condominiumId) {
      needsSeed = true;
    } else {
      // Verifica se o condomínio e os dados realmente existem no banco
      const condoExists = await Condominium.exists({ _id: demoUser.condominiumId });
      if (!condoExists) {
        needsSeed = true;
      } else {
        const unitsExist = await Unit.exists({ condominiumId: demoUser.condominiumId });
        if (!unitsExist) {
          needsSeed = true;
        }
      }
    }

    if (needsSeed) {
      await seedDemo();
      demoUser = await User.findOne({ email: DEMO_EMAIL });
    }

    if (!demoUser) {
      res.status(500).json({ error: 'Não foi possível inicializar o ambiente de demonstração.' });
      return;
    }

    // Marcar como demo via updateOne para evitar problemas de tipo do Mongoose
    if (!demoUser.isDemo) {
      await User.updateOne({ _id: demoUser._id }, { $set: { isDemo: true } });
    }

    const token = generateToken((demoUser._id as mongoose.Types.ObjectId).toString());

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
    res.status(500).json({ error: 'Erro ao iniciar demonstração', details: errorDetails(error) });
  }
};
