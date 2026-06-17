import mongoose from 'mongoose';
import Notification from '../models/Notification';

interface NotificationInput {
  condominiumId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  targetRole?: 'admin' | 'resident';
  type: 'payment' | 'issue' | 'reservation' | 'announcement' | 'system';
  title: string;
  message: string;
  link?: string;
}

export const notify = async (input: NotificationInput): Promise<void> => {
  await Notification.create({
    condominiumId: input.condominiumId,
    userId: input.userId,
    targetRole: input.targetRole,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link || '',
  }).catch(() => undefined);
};
