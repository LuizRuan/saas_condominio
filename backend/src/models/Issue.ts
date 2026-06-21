import mongoose, { Document, Schema } from 'mongoose';

export interface IIssue extends Document {
  condominiumId: mongoose.Types.ObjectId;
  unitId: mongoose.Types.ObjectId;
  residentId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'noise' | 'maintenance' | 'security' | 'cleaning' | 'garage' | 'leak' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  response: string;
  photos: string[];
  messages: {
    authorId?: mongoose.Types.ObjectId;
    authorRole: 'admin' | 'subadmin' | 'concierge' | 'financial' | 'resident';
    authorName: string;
    message: string;
    photos: string[];
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    residentId: { type: Schema.Types.ObjectId, ref: 'Resident' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['noise', 'maintenance', 'security', 'cleaning', 'garage', 'leak', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
    response: { type: String, default: '' },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: (photos: string[]) => photos.length <= 3,
        message: 'Uma ocorrência pode ter no máximo 3 fotos',
      },
    },
    messages: [{
      authorId: { type: Schema.Types.ObjectId, ref: 'User' },
      authorRole: { type: String, enum: ['admin', 'subadmin', 'concierge', 'financial', 'resident'], required: true },
      authorName: { type: String, default: 'Usuário' },
      message: { type: String, required: true },
      photos: { type: [String], default: [] },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

// Basic indexes
IssueSchema.index({ condominiumId: 1 });
IssueSchema.index({ unitId: 1 });
// Compound indexes for common query patterns
IssueSchema.index({ condominiumId: 1, status: 1, createdAt: -1 });
IssueSchema.index({ condominiumId: 1, priority: 1, createdAt: -1 });

export default mongoose.model<IIssue>('Issue', IssueSchema);
