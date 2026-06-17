import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  condominiumId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  targetRole?: 'admin' | 'resident';
  type: 'payment' | 'issue' | 'reservation' | 'announcement' | 'system';
  title: string;
  message: string;
  link?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetRole: { type: String, enum: ['admin', 'resident'] },
    type: { type: String, enum: ['payment', 'issue', 'reservation', 'announcement', 'system'], required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    readAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ condominiumId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ condominiumId: 1, targetRole: 1, readAt: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
