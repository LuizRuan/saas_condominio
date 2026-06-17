import mongoose from 'mongoose';
import Charge from '../models/Charge';

export const syncOverdueCharges = async (condominiumId: mongoose.Types.ObjectId): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Charge.updateMany(
    {
      condominiumId,
      status: 'pending',
      dueDate: { $lt: today },
    },
    {
      $set: { status: 'late' },
      $push: {
        paymentHistory: {
          status: 'late',
          note: 'Marcada automaticamente como atrasada pelo vencimento',
          createdAt: new Date(),
        },
      },
    }
  );
};
