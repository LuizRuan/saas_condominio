import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Condominium from '../models/Condominium';

dotenv.config();

const run = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) throw new Error('MONGO_URI não definida no .env');

  await mongoose.connect(mongoURI);
  console.log('✅ Conectado ao MongoDB');

  const email = 'ruanuchiha77@gmail.com';
  const user = await User.findOne({ email });
  if (!user) { console.error(`❌ Usuário ${email} não encontrado`); process.exit(1); }

  const condo = await Condominium.findOne({ ownerId: user._id });
  if (!condo) { console.error('❌ Condomínio não encontrado para este usuário'); process.exit(1); }

  condo.plan = 'pro';
  condo.subscriptionStatus = 'active';
  condo.billingCycle = 'monthly';
  condo.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await condo.save();

  console.log(`✅ Condomínio "${condo.name}" (${condo._id}) atualizado para plano Pro`);
  await mongoose.disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });
