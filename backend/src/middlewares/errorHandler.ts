import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Erro:', err.message);

  if (err.message === 'Origem não permitida pelo CORS') {
    res.status(403).json({ error: err.message });
    return;
  }

  // Multer Error Catching
  if (err.name === 'MulterError' && (err as any).code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Arquivo muito grande. O limite é de 5MB.' });
    return;
  }

  // File filter error catching (from our custom filter)
  if (err.message.includes('Formato de arquivo inválido')) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ error: 'Dados inválidos', details: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(409).json({ error: 'Registro duplicado' });
    return;
  }

  res.status(500).json({ error: 'Erro interno do servidor' });
};
