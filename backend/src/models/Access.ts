import mongoose, { Schema, Document } from 'mongoose';

export interface IAccess extends Document {
  condominiumId: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  visitorName: string;
  documentType?: 'rg' | 'cpf' | 'other';
  documentNumber?: string;
  type: 'visitor' | 'service_provider' | 'delivery';
  status: 'active' | 'finished';
  vehiclePlate?: string;
  entryTime: Date;
  exitTime?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccessSchema = new Schema<IAccess>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    visitorName: { type: String, required: true, trim: true },
    documentType: { type: String, enum: ['rg', 'cpf', 'other'] },
    documentNumber: { type: String, trim: true, select: false },
    type: { type: String, enum: ['visitor', 'service_provider', 'delivery'], required: true },
    status: { type: String, enum: ['active', 'finished'], default: 'active' },
    vehiclePlate: { type: String, trim: true, uppercase: true },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AccessSchema.index({ condominiumId: 1, status: 1 });
AccessSchema.index({ condominiumId: 1, unitId: 1 });

export default mongoose.model<IAccess>('Access', AccessSchema);
