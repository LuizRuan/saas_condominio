import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  condominiumId: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  action: string;
  entity: string;
  entityId?: mongoose.Types.ObjectId;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, default: 'Sistema', trim: true },
    action: { type: String, required: true, trim: true },
    entity: { type: String, required: true, trim: true },
    entityId: { type: Schema.Types.ObjectId },
    message: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AuditLogSchema.index({ condominiumId: 1, createdAt: -1 });
AuditLogSchema.index({ condominiumId: 1, entity: 1, entityId: 1 });
// Auto-delete logs older than 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
