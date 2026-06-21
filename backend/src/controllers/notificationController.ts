import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { errorDetails } from '../utils/errorDetails';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter = req.user!.role === 'admin'
      ? {
        condominiumId: req.user!.condominiumId,
        $or: [{ targetRole: 'admin' }, { userId: req.user!._id }],
      }
      : {
        condominiumId: req.user!.condominiumId,
        $or: [{ userId: req.user!._id }, { targetRole: 'resident' }],
      };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit || 20));

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar notificações', details: errorDetails(error) });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        condominiumId: req.user!.condominiumId,
        $or: [
          { userId: req.user!._id },
          { targetRole: req.user!.role },
        ],
      },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notificação não encontrada' });
      return;
    }

    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao marcar notificação', details: errorDetails(error) });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await Notification.updateMany(
      {
        condominiumId: req.user!.condominiumId,
        readAt: { $exists: false },
        $or: [
          { userId: req.user!._id },
          { targetRole: req.user!.role },
        ],
      },
      { readAt: new Date() }
    );

    res.json({ updated: result.modifiedCount });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao marcar notificações', details: errorDetails(error) });
  }
};
