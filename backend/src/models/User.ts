import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'resident';
  condominiumId?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: '', trim: true },
    role: { type: String, enum: ['admin', 'resident'], default: 'resident' },
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium' },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.index({ condominiumId: 1 });

export default mongoose.model<IUser>('User', UserSchema);
