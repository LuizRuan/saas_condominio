import { Response } from 'express';
import Announcement from '../models/Announcement';
import { AuthRequest } from '../middlewares/auth';

const MAX_PHOTOS = 8;
const MAX_PHOTO_PAYLOAD_BYTES = 9 * 1024 * 1024;

const normalizePhotos = (photos: unknown): string[] => {
  if (!Array.isArray(photos)) return [];

  const normalized = photos
    .filter((photo): photo is string => typeof photo === 'string')
    .map((photo) => photo.trim())
    .filter(Boolean);

  if (normalized.length > MAX_PHOTOS) {
    throw new Error(`Envie no máximo ${MAX_PHOTOS} fotos por comunicado`);
  }

  const invalid = normalized.some((photo) => !photo.startsWith('data:image/'));
  if (invalid) {
    throw new Error('As fotos devem ser imagens válidas');
  }

  const payloadSize = Buffer.byteLength(JSON.stringify(normalized), 'utf8');
  if (payloadSize > MAX_PHOTO_PAYLOAD_BYTES) {
    throw new Error('As fotos ultrapassam o limite permitido. Reduza a quantidade ou o tamanho das imagens.');
  }

  return normalized;
};

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, category, isPinned, photos } = req.body;
    if (!title?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
      return;
    }

    let normalizedPhotos: string[];
    try {
      normalizedPhotos = normalizePhotos(photos);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      category: category || 'general',
      isPinned: Boolean(isPinned),
      photos: normalizedPhotos,
      condominiumId: req.user!.condominiumId,
      createdBy: req.user!._id,
    });
    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar comunicado', details: error.message });
  }
};

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const skip = (page - 1) * limit;

    const filter = { condominiumId: req.user!.condominiumId };

    const [data, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'name')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments(filter),
    ]);

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar comunicados', details: error.message });
  }
};

export const getAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    }).populate('createdBy', 'name');
    if (!announcement) { res.status(404).json({ error: 'Comunicado não encontrado' }); return; }
    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar comunicado', details: error.message });
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, category, isPinned, photos } = req.body;
    if (!title?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
      return;
    }

    let normalizedPhotos: string[];
    try {
      normalizedPhotos = normalizePhotos(photos);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      {
        title: title.trim(),
        message: message.trim(),
        category: category || 'general',
        isPinned: Boolean(isPinned),
        photos: normalizedPhotos,
      },
      { new: true, runValidators: true }
    );
    if (!announcement) { res.status(404).json({ error: 'Comunicado não encontrado' }); return; }
    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar comunicado', details: error.message });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const a = await Announcement.findOneAndDelete({ _id: req.params.id, condominiumId: req.user!.condominiumId });
    if (!a) { res.status(404).json({ error: 'Comunicado não encontrado' }); return; }
    res.json({ message: 'Comunicado excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir comunicado', details: error.message });
  }
};
