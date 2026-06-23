import mongoose, { Document, Schema } from 'mongoose';

export interface IReservation extends Document {
  condominiumId: mongoose.Types.ObjectId;
  unitId: mongoose.Types.ObjectId;
  residentId?: mongoose.Types.ObjectId;
  area: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    residentId: { type: Schema.Types.ObjectId, ref: 'Resident' },
    area: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ReservationSchema.index({ condominiumId: 1 });
ReservationSchema.index({ condominiumId: 1, area: 1, date: 1 });
ReservationSchema.index({ unitId: 1 });
// Listagem com filtro de status e ordenação por data: find({condominiumId,[status]}).sort({date:-1})
ReservationSchema.index({ condominiumId: 1, status: 1, date: -1 });

export default mongoose.model<IReservation>('Reservation', ReservationSchema);
