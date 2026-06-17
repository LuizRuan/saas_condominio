import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middlewares/auth';

interface AuditInput {
  action: string;
  entity: string;
  entityId?: mongoose.Types.ObjectId | string;
  message: string;
  metadata?: Record<string, unknown>;
}

export const audit = async (req: AuthRequest, input: AuditInput): Promise<void> => {
  if (!req.user?.condominiumId) return;

  await AuditLog.create({
    condominiumId: req.user.condominiumId,
    actorId: req.user._id,
    actorName: req.user.name,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    message: input.message,
    metadata: input.metadata || {},
  }).catch(() => undefined);
};
