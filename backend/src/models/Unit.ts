import mongoose, { Document, Schema } from 'mongoose';

export interface IUnit extends Document {
  condominiumId: mongoose.Types.ObjectId;
  block: string;
  number: string;
  status: 'occupied' | 'empty' | 'late';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    block: { type: String, default: '', trim: true },
    number: { type: String, required: true, trim: true },
    status: { type: String, enum: ['occupied', 'empty', 'late'], default: 'empty' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

UnitSchema.index({ condominiumId: 1 });
UnitSchema.index({ condominiumId: 1, block: 1, number: 1 }, { unique: true });
// Bulk charge: find({condominiumId, status:{$ne:'empty'}})
UnitSchema.index({ condominiumId: 1, status: 1 });

export default mongoose.model<IUnit>('Unit', UnitSchema);
