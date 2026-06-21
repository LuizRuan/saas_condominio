import mongoose, { Document, Schema } from 'mongoose';

export interface IResident extends Document {
  condominiumId: mongoose.Types.ObjectId;
  unitId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  type: 'owner' | 'tenant' | 'financial_responsible';
  isFinancialResponsible: boolean;
  userId?: mongoose.Types.ObjectId;
  inviteToken: string;
  inviteExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentSchema = new Schema<IResident>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    type: {
      type: String,
      enum: ['owner', 'tenant', 'financial_responsible'],
      default: 'owner',
    },
    isFinancialResponsible: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    inviteToken: { type: String, default: '', select: false },
    inviteExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

ResidentSchema.index({ condominiumId: 1 });
ResidentSchema.index({ unitId: 1 });
ResidentSchema.index({ userId: 1 }, { unique: true, sparse: true });
ResidentSchema.index(
  { condominiumId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string', $gt: '' } },
  }
);

export default mongoose.model<IResident>('Resident', ResidentSchema);
