import mongoose, { Document, Schema } from 'mongoose';

export type ExpenseCategory =
  | 'utilities'     // Água, luz e gás
  | 'cleaning'      // Limpeza
  | 'security'      // Segurança
  | 'maintenance'   // Manutenção
  | 'employees'     // Funcionários
  | 'works'         // Obras
  | 'providers'     // Prestadores de serviço
  | 'other';        // Outro

export interface IExpense extends Document {
  condominiumId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  status: 'paid' | 'pending';
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    condominiumId: { type: Schema.Types.ObjectId, ref: 'Condominium', required: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['utilities', 'cleaning', 'security', 'maintenance', 'employees', 'works', 'providers', 'other'],
      required: true,
    },
    date: { type: Date, required: true },
    status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    notes: { type: String, default: '', trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

ExpenseSchema.index({ condominiumId: 1, date: -1 });
ExpenseSchema.index({ condominiumId: 1, category: 1, status: 1 });
ExpenseSchema.index({ condominiumId: 1, deletedAt: 1 });
// Listagem principal: find({condominiumId, deletedAt:null}).sort({date:-1})
ExpenseSchema.index({ condominiumId: 1, deletedAt: 1, date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
