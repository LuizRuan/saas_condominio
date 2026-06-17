import mongoose, { Document, Schema } from 'mongoose';

export interface IReservationBlock extends Document {
  condominiumId: mongoose.Types.ObjectId;
  area: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationBlockSchema = new Schema<IReservationBlock>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    area: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, default: 'Bloqueio administrativo', trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ReservationBlockSchema.index({ condominiumId: 1, area: 1, date: 1 });

export default mongoose.model<IReservationBlock>('ReservationBlock', ReservationBlockSchema);
