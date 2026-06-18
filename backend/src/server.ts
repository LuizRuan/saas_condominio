import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { getAllowedOrigins, validateEnvironment } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Security
app.set('trust proxy', 1);
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || getAllowedOrigins().includes(origin.replace(/\/+$/, ''))) {
        callback(null, true);
        return;
      }
      callback(new Error('Origem não permitida pelo CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use(limiter);

// Strict rate limiter for auth routes (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skip: (req) => req.method === 'GET',
});
app.use('/api/auth', authLimiter);

// Body parsing — limit kept tight to prevent DoS (images are compressed client-side)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  validateEnvironment();
  await connectDB();
  app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('❌ Falha ao iniciar o servidor:', error);
  process.exit(1);
});

export default app;
