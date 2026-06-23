const isPlaceholder = (value: string): boolean =>
  value.includes('usuario:senha') ||
  value.includes('sua_chave_secreta') ||
  value.includes('troque_por');

export const isProduction = (): boolean => process.env.NODE_ENV === 'production';

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }

  if (isProduction() && (secret.length < 32 || isPlaceholder(secret))) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em produção');
  }

  return secret;
};

export const getMongoUri = (): string | null => {
  const uri = process.env.MONGO_URI?.trim();

  if (!uri || isPlaceholder(uri)) {
    if (isProduction()) {
      throw new Error('MONGO_URI não configurada para produção');
    }
    return null;
  }

  return uri;
};

export const getAllowedOrigins = (): string[] => {
  const configuredOrigins = process.env.CLIENT_URL
    ?.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean) ?? [];

  if (isProduction() && configuredOrigins.length === 0) {
    throw new Error('CLIENT_URL não configurada para produção');
  }

  if (!isProduction()) {
    configuredOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
  }

  return [...new Set(configuredOrigins)];
};

export const getMercadoPagoAccessToken = (): string => {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
  return token;
};

export const getMercadoPagoWebhookSecret = (): string => {
  return process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ?? '';
};

export const validateEnvironment = (): void => {
  getJwtSecret();
  getMongoUri();
  getAllowedOrigins();

  // Pagamento (Mercado Pago) e e-mail (Resend): obrigatórias em produção,
  // apenas aviso em desenvolvimento para não travar o ambiente local.
  const prod = isProduction();

  // Mercado Pago — crítico para checkout/webhook. Em produção, falha no boot.
  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  const mpWebhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  const missingMp: string[] = [];
  if (!mpToken) missingMp.push('MERCADO_PAGO_ACCESS_TOKEN');
  if (!mpWebhookSecret) missingMp.push('MERCADO_PAGO_WEBHOOK_SECRET');
  if (missingMp.length > 0) {
    const msg = `Variáveis do Mercado Pago ausentes: ${missingMp.join(', ')}`;
    if (prod) {
      throw new Error(`${msg} — obrigatórias em produção.`);
    }
    console.warn(`[ENV] ${msg} — pagamentos/webhook desabilitados (ok em desenvolvimento).`);
  }

  // Resend (e-mail de recuperação de senha) — degrada graciosamente; apenas aviso.
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();
  if (!resendKey || !emailFrom) {
    console.warn('[ENV] RESEND_API_KEY/EMAIL_FROM ausentes — e-mail de recuperação NÃO será enviado.');
  }
};
