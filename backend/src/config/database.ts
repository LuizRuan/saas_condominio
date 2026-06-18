import mongoose from 'mongoose';
import { getMongoUri } from './env';

const seedTestUsers = async () => {
  // Dynamically import to avoid issues when not needed
  const bcrypt = (await import('bcryptjs')).default;
  const User = (await import('../models/User')).default;
  const Condominium = (await import('../models/Condominium')).default;
  const Unit = (await import('../models/Unit')).default;
  const Resident = (await import('../models/Resident')).default;

  const already = await User.findOne({ email: 'sindico@teste.com' });
  if (already) return; // already seeded

  const salt = await bcrypt.genSalt(10);

  // Admin (síndico)
  const adminUser = await User.create({
    name: 'João Síndico',
    email: 'sindico@teste.com',
    password: await bcrypt.hash('123456', salt),
    phone: '11999990001',
    role: 'admin',
  });

  const condo = await Condominium.create({
    name: 'Residencial Aurora',
    cnpj: '12.345.678/0001-90',
    address: 'Rua das Flores, 100',
    city: 'São Paulo',
    state: 'SP',
    pixKey: 'sindico@teste.com',
    defaultFee: 350,
    dueDay: 10,
    ownerId: adminUser._id,
  });

  adminUser.condominiumId = condo._id as any;
  await adminUser.save();

  const unit = await Unit.create({
    condominiumId: condo._id,
    block: 'A',
    number: '101',
    status: 'occupied',
    notes: '',
  });

  // Resident (morador)
  const residentUser = await User.create({
    name: 'Maria Moradora',
    email: 'morador@teste.com',
    password: await bcrypt.hash('123456', salt),
    phone: '11999990002',
    role: 'resident',
    condominiumId: condo._id,
    unitId: unit._id,
  });

  await Resident.create({
    condominiumId: condo._id,
    unitId: unit._id,
    name: 'Maria Moradora',
    phone: '11999990002',
    email: 'morador@teste.com',
    type: 'owner',
    isFinancialResponsible: true,
    userId: residentUser._id,
  });

  console.log('\n  ══════════════════════════════════════════');
  console.log('  🧪 MODO DE TESTE — usuários criados:');
  console.log('  ──────────────────────────────────────────');
  console.log('  👤 Síndico  → sindico@teste.com  / 123456');
  console.log('  🏠 Morador  → morador@teste.com  / 123456');
  console.log('  ══════════════════════════════════════════\n');
};

const connectDB = async (): Promise<void> => {
  const mongoURI = getMongoUri();

  if (!mongoURI) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('🧪 MongoDB in-memory iniciado (modo teste)');
    
    // Povoar com dados de demonstração avançados
    const { seedDemo } = await import('../utils/seed-demo');
    await seedDemo();
    
    return;
  }

  await mongoose.connect(mongoURI);
  console.log('✅ MongoDB Atlas conectado com sucesso');
};

export default connectDB;
