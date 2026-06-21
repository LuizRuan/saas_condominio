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
};
