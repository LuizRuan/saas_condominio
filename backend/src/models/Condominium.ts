import mongoose, { Document, Schema } from 'mongoose';

export interface ICondominium extends Document {
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  pixKey: string;
  defaultFee: number;
  dueDay: number;
  ownerId: mongoose.Types.ObjectId;
  plan: 'free' | 'pro' | 'ultra';
  createdAt: Date;
  updatedAt: Date;
}

const CondominiumSchema = new Schema<ICondominium>(
  {
    name: { type: String, required: true, trim: true },
    cnpj: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pixKey: { type: String, default: '', trim: true },
    defaultFee: { type: Number, default: 0, min: 0 },
    dueDay: { type: Number, default: 10, min: 1, max: 31 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['free', 'pro', 'ultra'], default: 'free' },
  },
  { timestamps: true }
);

CondominiumSchema.index({ ownerId: 1 }, { unique: true });

export default mongoose.model<ICondominium>('Condominium', CondominiumSchema);
