import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import User from '../models/User';

const sendResetEmail = async (toEmail: string, resetUrl: string): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error('[EMAIL] Variáveis RESEND_API_KEY ou EMAIL_FROM não configuradas — e-mail de recuperação NÃO enviado.');
    return;
  }
  const resend = new Resend(apiKey);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;background:#f5f7fb;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;padding:40px;box-shadow:0 4px 40px rgba(0,0,0,0.08);">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:24px;font-weight:900;letter-spacing:-0.04em;color:#0f172a;">Domus</span>
    </div>
    <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 10px;">Redefinição de senha</h2>
    <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 28px;">
      Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#4f46e5);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">
        Redefinir senha
      </a>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;">Este link expira em 1 hora.</p>
    <p style="font-size:12px;color:#94a3b8;text-align:center;">Se você não solicitou a redefinição, ignore este e-mail com segurança.</p>
  </div>
</body></html>`;
  await resend.emails.send({ from, to: toEmail, subject: 'Redefinição de senha - Domus', html });
};

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

    const clientUrl = (process.env.CLIENT_URL || '').replace(/\/+$/, '');
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (emailErr: any) {
      console.error(`[EMAIL] Falha ao enviar recuperação de senha para ${user.email}:`, emailErr?.message);
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
