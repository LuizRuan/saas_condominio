import mongoose, { Document, Schema } from 'mongoose';

export interface IPackage extends Document {
  condominiumId: mongoose.Types.ObjectId;
  unitId: mongoose.Types.ObjectId;
  description: string;
  trackingCode?: string;
  status: 'pending' | 'delivered';
  receivedAt: Date;
  receivedBy: mongoose.Types.ObjectId; // User who registered the package (admin/porter)
  deliveredAt?: Date;
  deliveredTo?: string; // Name of the person who picked it up
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    description: { type: String, required: true, trim: true },
    trackingCode: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'delivered'], default: 'pending' },
    receivedAt: { type: Date, default: Date.now },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deliveredAt: { type: Date },
    deliveredTo: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

PackageSchema.index({ condominiumId: 1, status: 1 });
PackageSchema.index({ unitId: 1 });

export default mongoose.model<IPackage>('Package', PackageSchema);
