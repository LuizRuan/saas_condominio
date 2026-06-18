import { Response } from 'express';
import Issue from '../models/Issue';
import Unit from '../models/Unit';
import Resident from '../models/Resident';
import { AuthRequest } from '../middlewares/auth';
import { findResidentForUser } from '../utils/residentContext';
import { notify } from '../utils/notifications';
import { audit } from '../utils/audit';

const normalizePhotos = (photos: unknown): string[] => {
  if (!Array.isArray(photos)) return [];
  return photos
    .filter((photo): photo is string => typeof photo === 'string' && photo.startsWith('data:image/'))
    .slice(0, 6);
};

export const createIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, priority } = req.body;
    const condominiumId = req.user!.condominiumId;

    if (!title?.trim() || !description?.trim()) {
      res.status(400).json({ error: 'Título e descrição são obrigatórios' });
      return;
    }

    const unitId = req.user!.role === 'resident' ? req.user!.unitId : req.body.unitId;
    const unit = await Unit.findOne({ _id: unitId, condominiumId });
    if (!unit) {
      res.status(400).json({ error: 'Unidade inválida para este condomínio' });
      return;
    }

    const resident = await findResidentForUser(req.user!);
    if (req.user!.role === 'resident' && !resident) {
      res.status(409).json({ error: 'Conta de morador sem cadastro vinculado' });
      return;
    }

    const issue = await Issue.create({
      condominiumId,
      unitId: unit._id,
      residentId: resident?._id,
      title: title.trim(),
      description: description.trim(),
      category: category || 'other',
      priority: priority || 'medium',
      photos: normalizePhotos(req.body.photos),
      messages: [{
        authorId: req.user!._id,
        authorRole: req.user!.role,
        authorName: req.user!.name,
        message: description.trim(),
        photos: normalizePhotos(req.body.photos),
      }],
    });

    if (req.user!.role === 'resident') {
      await notify({
        condominiumId: issue.condominiumId,
        targetRole: 'admin',
        type: 'issue',
        title: `${req.user!.name} abriu uma ocorrência`,
        message: `${issue.title} em ${unit.block ? `Bloco ${unit.block} - ` : ''}Apt ${unit.number}`,
        link: '/ocorrencias',
      });
    }

    await audit(req, {
      action: 'create',
      entity: 'issue',
      entityId: issue._id as any,
      message: `Ocorrência "${issue.title}" criada`,
    });

    res.status(201).json(issue);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar ocorrência', details: error.message });
  }
};

export const getIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { condominiumId: req.user!.condominiumId };
    if (req.user!.role === 'resident') filter.unitId = req.user!.unitId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Issue.find(filter)
        .populate('unitId', 'block number')
        .populate('residentId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Issue.countDocuments(filter),
    ]);

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar ocorrências', details: error.message });
  }
};

export const getIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
      ...(req.user!.role === 'resident' ? { unitId: req.user!.unitId } : {}),
    })
      .populate('unitId', 'block number').populate('residentId', 'name');
    if (!issue) { res.status(404).json({ error: 'Ocorrência não encontrada' }); return; }
    res.json(issue);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar ocorrência', details: error.message });
  }
};

export const updateIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const update = {
      ...(req.body.title !== undefined ? { title: req.body.title } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      ...(req.body.category !== undefined ? { category: req.body.category } : {}),
      ...(req.body.priority !== undefined ? { priority: req.body.priority } : {}),
    };
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      update, { new: true, runValidators: true }
    );
    if (!issue) { res.status(404).json({ error: 'Ocorrência não encontrada' }); return; }
    await audit(req, {
      action: 'update',
      entity: 'issue',
      entityId: issue._id as any,
      message: `Ocorrência "${issue.title}" atualizada`,
    });
    res.json(issue);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar ocorrência', details: error.message });
  }
};

export const updateIssueStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, response } = req.body;
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Status inválido' });
      return;
    }

    const update: any = { status };
    if (response !== undefined) update.response = response;

    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      update, { new: true, runValidators: true }
    );
    if (!issue) { res.status(404).json({ error: 'Ocorrência não encontrada' }); return; }

    if (req.user!.role === 'admin' && issue.residentId) {
      const resident = await Resident.findById(issue.residentId);
      if (resident?.userId) {
        await notify({
          condominiumId: issue.condominiumId,
          userId: resident.userId,
          type: 'issue',
          title: 'Sua ocorrência foi atualizada',
          message: `${issue.title} agora está ${status === 'resolved' ? 'resolvida' : 'em análise'}`,
          link: '/morador/ocorrencias',
        });
      }
    }

    await audit(req, {
      action: 'status',
      entity: 'issue',
      entityId: issue._id as any,
      message: `Status da ocorrência "${issue.title}" alterado para ${status}`,
    });

    res.json(issue);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar status', details: error.message });
  }
};

export const deleteIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issue = await Issue.findOneAndDelete({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    });

    if (!issue) {
      res.status(404).json({ error: 'Ocorrência não encontrada' });
      return;
    }

    await audit(req, {
      action: 'delete',
      entity: 'issue',
      entityId: issue._id as any,
      message: `Ocorrência "${issue.title}" excluída`,
    });

    res.json({ message: 'Ocorrência excluída com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir ocorrência', details: error.message });
  }
};

export const addIssueMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const message = String(req.body.message || '').trim();
    const photos = normalizePhotos(req.body.photos);

    if (!message && photos.length === 0) {
      res.status(400).json({ error: 'Mensagem ou foto é obrigatória' });
      return;
    }

    const issue = await Issue.findOne({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
      ...(req.user!.role === 'resident' ? { unitId: req.user!.unitId } : {}),
    });

    if (!issue) {
      res.status(404).json({ error: 'Ocorrência não encontrada' });
      return;
    }

    issue.messages.push({
      authorId: req.user!._id as any,
      authorRole: req.user!.role,
      authorName: req.user!.name,
      message: message || 'Foto anexada',
      photos,
      createdAt: new Date(),
    });

    if (req.user!.role === 'admin' && message) {
      issue.response = message;
      if (issue.status === 'open') issue.status = 'in_progress';
    }

    await issue.save();

    if (req.user!.role === 'resident') {
      await notify({
        condominiumId: issue.condominiumId,
        targetRole: 'admin',
        type: 'issue',
        title: `${req.user!.name} respondeu uma ocorrência`,
        message: issue.title,
        link: '/ocorrencias',
      });
    } else if (issue.residentId) {
      const resident = await Resident.findById(issue.residentId);
      if (resident?.userId) {
        await notify({
          condominiumId: issue.condominiumId,
          userId: resident.userId,
          type: 'issue',
          title: 'Nova resposta do síndico',
          message: issue.title,
          link: '/morador/ocorrencias',
        });
      }
    }

    await audit(req, {
      action: 'message',
      entity: 'issue',
      entityId: issue._id as any,
      message: `Nova mensagem na ocorrência "${issue.title}"`,
    });

    res.json(issue);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao adicionar mensagem', details: error.message });
  }
};
