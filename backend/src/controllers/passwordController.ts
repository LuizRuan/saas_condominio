import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User';

// ─── Forgot Password ─────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Sends reset token via email. Always returns 200 to prevent email enumeration.
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Cast to string to prevent NoSQL injection via object payloads like { "$gt": "" }
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      res.status(400).json({ error: 'Informe um e-mail válido.' });
      return;
    }

    // Always return 200 to avoid email enumeration
    const user = await User.findOne({ email }).select('+resetToken +resetTokenExpiry');
    if (!user) {
      res.json({ message: 'Se este e-mail estiver cadastrado, você receberá um link em breve.' });
      return;
    }

    // Generate a 32-byte hex token (valid for 1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // TODO: Replace with your email service call (SendGrid, Resend, SES, etc.)
    // Example: await emailService.sendPasswordReset(user.email, token)
    // The token is intentionally NOT returned in production responses
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[DEV ONLY — Password Reset] Token for ${user.email}: ${token}`);
    }

    res.json({ message: 'Se este e-mail estiver cadastrado, você receberá um link em breve.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao solicitar redefinição de senha.', details: error.message });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Cast to string to prevent NoSQL injection via object payloads
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');

    if (!token || !password) {
      res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    // Hash the incoming token to compare with what's stored
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select('+resetToken +resetTokenExpiry');

    if (!user) {
      res.status(400).json({ error: 'Token inválido ou expirado. Solicite um novo link.' });
      return;
    }

    // Update password and clear token fields
    user.password = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso. Faça login com sua nova senha.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao redefinir a senha.', details: error.message });
  }
};
