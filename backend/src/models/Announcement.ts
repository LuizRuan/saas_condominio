import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  condominiumId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  category: 'general' | 'maintenance' | 'assembly' | 'security' | 'financial';
  isPinned: boolean;
  photos: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'maintenance', 'assembly', 'security', 'financial'],
      default: 'general',
    },
    isPinned: { type: Boolean, default: false },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: (photos: string[]) => photos.length <= 8,
        message: 'Um comunicado pode ter no máximo 8 fotos',
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ condominiumId: 1 });
AnnouncementSchema.index({ condominiumId: 1, isPinned: -1, createdAt: -1 });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
