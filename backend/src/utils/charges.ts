import mongoose from 'mongoose';
import Charge from '../models/Charge';

// Prevent redundant write operations — sync runs at most once per hour per condominium
const lastSyncMap = new Map<string, number>();
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export const syncOverdueCharges = async (condominiumId: mongoose.Types.ObjectId): Promise<void> => {
  const key = condominiumId.toString();
  const now = Date.now();
  const last = lastSyncMap.get(key) ?? 0;

  if (now - last < SYNC_INTERVAL_MS) return; // debounced — skip redundant writes
  lastSyncMap.set(key, now);

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
