import mongoose, { Schema, HydratedDocument } from 'mongoose';

export interface ISubscription {
  condominiumId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  gateway: 'mercadopago';
  plan: 'pro' | 'ultra';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: 'BRL';
  status: 'pending' | 'active' | 'canceled' | 'failed' | 'overdue';
  mercadoPagoPreapprovalId?: string;
  mercadoPagoPaymentId?: string;
  externalReference: string;
  initPoint?: string;
  rawStatus?: string;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ISubscriptionDoc = HydratedDocument<ISubscription>;

const SubscriptionSchema = new Schema<ISubscription>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gateway: { type: String, enum: ['mercadopago'], required: true },
    plan: { type: String, enum: ['pro', 'ultra'], required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BRL' },
    status: {
      type: String,
      enum: ['pending', 'active', 'canceled', 'failed', 'overdue'],
      default: 'pending',
    },
    mercadoPagoPreapprovalId: { type: String },
    mercadoPagoPaymentId: { type: String },
    externalReference: { type: String, required: true },
    initPoint: { type: String },
    rawStatus: { type: String },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ condominiumId: 1 });
SubscriptionSchema.index({ mercadoPagoPreapprovalId: 1 });
SubscriptionSchema.index({ externalReference: 1 });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
