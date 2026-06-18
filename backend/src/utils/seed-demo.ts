import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User';
import Condominium from '../models/Condominium';
import Unit from '../models/Unit';
import Resident from '../models/Resident';
import Charge from '../models/Charge';
import Expense from '../models/Expense';
import Announcement from '../models/Announcement';
import Issue from '../models/Issue';
import Package from '../models/Package';
import Reservation from '../models/Reservation';
import AuditLog from '../models/AuditLog';
import { getMongoUri } from '../config/env';

dotenv.config();

// Helpers para dados brasileiros aleatórios
const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Lucas', 'Fernanda', 'Rafael', 'Mariana', 'Roberto', 'Camila', 'Rodrigo', 'Aline', 'Marcelo', 'Patrícia', 'Felipe', 'Beatriz', 'Gustavo', 'Amanda', 'Eduardo', 'Letícia', 'Thiago', 'Natália', 'Diego', 'Carolina', 'Bruno', 'Bruna', 'Leandro', 'Vanessa'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Machado'];

const getRandomName = () => `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
const getRandomPhone = () => `119${Math.floor(Math.random() * 90000000) + 10000000}`;
const generateRandomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

export const seedDemo = async () => {
  try {
    // Limpar dados do ambiente (somente do sindicotest para proteger outros dados se houver)
    const adminEmail = 'sindicotest@gmail.com';
    const oldAdmin = await User.findOne({ email: adminEmail });
    if (oldAdmin) {
      const condoId = oldAdmin.condominiumId;
      if (condoId) {
        await User.deleteMany({ condominiumId: condoId });
        await Unit.deleteMany({ condominiumId: condoId });
        await Resident.deleteMany({ condominiumId: condoId });
        await Charge.deleteMany({ condominiumId: condoId });
        await Expense.deleteMany({ condominiumId: condoId });
        await Announcement.deleteMany({ condominiumId: condoId });
        await Issue.deleteMany({ condominiumId: condoId });
        await Package.deleteMany({ condominiumId: condoId });
        await Reservation.deleteMany({ condominiumId: condoId });
        await Condominium.deleteOne({ _id: condoId });
      }
      await User.deleteOne({ _id: oldAdmin._id });
    }

    console.log('🧹 Ambiente antigo limpo (sindicotest). Gerando novos dados...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    // 1. Criar Síndico
    const adminUser = await User.create({
      name: 'Síndico Demo',
      email: adminEmail,
      password: passwordHash,
      phone: '11999990001',
      role: 'admin',
    });

    // 2. Criar Condomínio
    const condo = await Condominium.create({
      name: 'Residencial Central Park',
      cnpj: '12.345.678/0001-90',
      address: 'Avenida Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      pixKey: adminEmail,
      defaultFee: 650, // R$ 650
      dueDay: 25,
      ownerId: adminUser._id,
    });

    adminUser.condominiumId = condo._id as any;
    await adminUser.save();

    console.log('🏢 Condomínio e Síndico criados.');

    // 3. Criar 100 Unidades (Blocos A, B, C, D - 25 cada)
    const blocks = ['A', 'B', 'C', 'D'];
    const unitsData = [];
    for (const block of blocks) {
      for (let i = 1; i <= 25; i++) {
        // Formato: andar + final (ex: 101, 102... 505)
        const andar = Math.ceil(i / 5);
        const final = i % 5 === 0 ? 5 : i % 5;
        unitsData.push({
          condominiumId: condo._id,
          block,
          number: `${andar}0${final}`,
          status: 'occupied',
        });
      }
    }
    const createdUnits = await Unit.insertMany(unitsData);
    console.log('🚪 100 Unidades criadas.');

    // 4. Criar 100 Moradores
    const residentsData = [];
    const usersData = [];
    
    // Vou criar users para os 5 primeiros moradores para testes de login de residente
    for (let i = 0; i < createdUnits.length; i++) {
      const unit = createdUnits[i];
      const name = getRandomName();
      const email = `morador${i+1}@teste.com`;
      const phone = getRandomPhone();
      
      let userId = null;
      if (i < 5) {
        const u = new User({
          name, email, password: passwordHash, phone, role: 'resident', condominiumId: condo._id, unitId: unit._id
        });
        usersData.push(u);
        userId = u._id;
      }

      residentsData.push({
        condominiumId: condo._id,
        unitId: unit._id,
        name,
        phone,
        email,
        type: Math.random() > 0.1 ? 'owner' : 'tenant', // 90% proprietário
        isFinancialResponsible: true,
        userId: userId || undefined,
      });
    }

    if (usersData.length > 0) await User.insertMany(usersData);
    const createdResidents = await Resident.insertMany(residentsData);
    console.log(`👥 100 Moradores criados (5 contas de login geradas).`);

    // 5. Inteligência Financeira: 6 Meses de Histórico
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }

    const chargesData = [];
    for (const date of months) {
      const refMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const isCurrentMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      
      for (const resident of createdResidents) {
        // Amount = Base + small random variable for gas/water
        const amount = condo.defaultFee + Math.floor(Math.random() * 50); 
        
        // Status definition
        let status = 'paid';
        let paidAt = null;
        
        if (isCurrentMonth) {
          const rand = Math.random();
          if (rand < 0.6) {
            status = 'paid';
            paidAt = generateRandomDate(date, now);
          } else if (rand < 0.95) {
            status = 'pending';
          } else {
            status = 'late';
          }
        } else {
          // Passado
          const rand = Math.random();
          if (rand < 0.95) {
            status = 'paid';
            paidAt = generateRandomDate(date, new Date(date.getFullYear(), date.getMonth() + 1, 0));
          } else if (rand < 0.98) {
            status = 'late';
          } else {
            status = 'pending';
          }
        }

        let dueDate = new Date(date.getFullYear(), date.getMonth(), condo.dueDay);

        if (status === 'pending' && !isCurrentMonth) {
          // TRUQUE VISUAL: Jogamos o vencimento pro futuro pra rotina automática 
          // não transformar essa pendência "fake" do passado em atraso.
          dueDate = new Date(now.getTime() + 86400000 * 30);
        }

        chargesData.push({
          condominiumId: condo._id,
          unitId: resident.unitId,
          residentId: resident._id,
          amount,
          description: `Taxa Condominial + Consumos - ${refMonth}`,
          referenceMonth: refMonth,
          dueDate,
          status,
          paidAt,
        });
      }
    }
    await Charge.insertMany(chargesData);
    console.log(`💵 ${chargesData.length} Cobranças (6 meses) criadas.`);

    // 6. Despesas (Expenses)
    const expensesData = [];
    const expenseCategories = ['maintenance', 'cleaning', 'employees', 'utilities', 'works', 'providers'];
    
    // Revenue is approx 100 * 650 = 65.000 per month
    for (const date of months) {
      // Create 10-15 expenses per month
      const numExpenses = 10 + Math.floor(Math.random() * 6);
      
      // Let's force a negative cashflow in month 3 (index 2)
      const forceNegative = months.indexOf(date) === 2;
      let targetTotal = forceNegative ? 75000 : 45000 + Math.random() * 10000;
      
      // Split targetTotal randomly into numExpenses
      for (let i = 0; i < numExpenses; i++) {
        const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        let amount = targetTotal / numExpenses;
        amount = amount * (0.5 + Math.random()); // add variance
        
        const isCurrentMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        let status = 'paid';
        if (isCurrentMonth && Math.random() > 0.7) status = 'pending';

        expensesData.push({
          condominiumId: condo._id,
          description: `${cat} - Ref. ${date.getMonth() + 1}/${date.getFullYear()}`,
          amount: Number(amount.toFixed(2)),
          category: cat,
          date: generateRandomDate(date, new Date(date.getFullYear(), date.getMonth() + 1, 0)),
          status,
          notes: 'Gerado via demo seed.',
          createdBy: adminUser._id,
        });
      }
    }
    await Expense.insertMany(expensesData);
    console.log(`📈 ${expensesData.length} Despesas (6 meses) criadas.`);

    // 7. Ocorrências (Issues)
    const issuesData = [];
    const issueExamples = [
      { t: 'Vazamento teto garagem', c: 'leak' },
      { t: 'Som alto apartamento 302', c: 'noise' },
      { t: 'Sugestão de lixeiras novas', c: 'other' },
      { t: 'Lâmpada corredor D queimada', c: 'maintenance' },
      { t: 'Portão travando', c: 'garage' },
    ];
    for (let i = 0; i < 35; i++) {
      const ex = issueExamples[Math.floor(Math.random() * issueExamples.length)];
      const randUnit = createdUnits[Math.floor(Math.random() * createdUnits.length)];
      
      let status = 'open';
      const r = Math.random();
      if (r < 0.3) status = 'in_progress';
      else if (r < 0.8) status = 'resolved'; // Aumentei a chance de resolvido para não superlotar o painel

      const createdAt = generateRandomDate(months[0], now);
      const updatedAt = status === 'resolved' ? new Date(createdAt.getTime() + Math.random() * 5 * 86400000) : createdAt;

      issuesData.push({
        condominiumId: condo._id,
        unitId: randUnit._id,
        title: ex.t,
        description: `Detalhes: ${ex.t}. Por favor, verificar o quanto antes.`,
        category: ex.c,
        status,
        createdAt,
        updatedAt,
      });
    }
    await Issue.insertMany(issuesData);
    console.log(`🚨 35 Ocorrências criadas (distribuídas nos 6 meses).`);

    // 8. Comunicados (Announcements)
    await Announcement.insertMany([
      {
        condominiumId: condo._id,
        title: 'Ata da Assembleia Geral Ordinária',
        message: 'A ata da última assembleia está disponível. Aprovamos a reforma da portaria para o próximo semestre.',
        isPinned: true,
        category: 'assembly',
        createdBy: adminUser._id,
        createdAt: new Date(now.getTime() - 86400000 * 2), // 2 dias atras
      },
      {
        condominiumId: condo._id,
        title: 'Manutenção Preventiva - Elevadores',
        message: 'Nesta quinta-feira os elevadores de serviço ficarão parados das 10h às 14h para manutenção.',
        isPinned: false,
        category: 'maintenance',
        createdBy: adminUser._id,
        createdAt: new Date(now.getTime() - 86400000 * 10),
      },
      {
        condominiumId: condo._id,
        title: 'Coleta Seletiva',
        message: 'Lembramos a todos a importância de separar o lixo reciclável. Novas lixeiras coloridas no subsolo.',
        isPinned: false,
        category: 'general',
        createdBy: adminUser._id,
        createdAt: new Date(now.getTime() - 86400000 * 25),
      }
    ]);
    console.log(`📢 Comunicados criados.`);

    // 9. Encomendas (Packages)
    const packagesData = [];
    for (let i = 0; i < 20; i++) {
      const randUnit = createdUnits[Math.floor(Math.random() * createdUnits.length)];
      const delivered = Math.random() > 0.3;
      packagesData.push({
        condominiumId: condo._id,
        unitId: randUnit._id,
        description: Math.random() > 0.5 ? 'Caixa Mercado Livre' : 'Pacote Amazon',
        trackingCode: `BR${Math.floor(Math.random() * 900000000)}`,
        status: delivered ? 'delivered' : 'pending',
        receivedAt: generateRandomDate(months[4], now),
        deliveredAt: delivered ? new Date() : undefined,
        receivedBy: adminUser._id,
      });
    }
    await Package.insertMany(packagesData);
    console.log(`📦 20 Encomendas criadas.`);

    // 10. Reservas (Reservations)
    const reservData = [];
    for (let i = 0; i < 10; i++) {
      const randUnit = createdUnits[Math.floor(Math.random() * createdUnits.length)];
      // 50% chance de ser no futuro
      const isPast = Math.random() > 0.5;
      const d = new Date(now.getTime() + (isPast ? -1 : 1) * Math.random() * 10 * 86400000);
      
      // Se for no futuro, 40% de chance de estar pendente
      let status = 'approved';
      if (!isPast && Math.random() < 0.4) {
        status = 'pending';
      }

      reservData.push({
        condominiumId: condo._id,
        unitId: randUnit._id,
        area: Math.random() > 0.5 ? 'Salão de Festas' : 'Churrasqueira',
        date: d,
        startTime: '10:00',
        endTime: '18:00',
        status,
        notes: 'Aniversário - 20 convidados',
      });
    }
    await Reservation.insertMany(reservData);
    console.log(`📅 10 Reservas criadas.`);

    // 11. Auditoria (AuditLogs) - Atividade Recente
    const auditData = [];
    const actions = [
      { a: 'CREATE', e: 'Despesa', m: 'Nova despesa registrada' },
      { a: 'UPDATE', e: 'Ocorrência', m: 'Status de ocorrência atualizado' },
      { a: 'CREATE', e: 'Comunicado', m: 'Novo comunicado publicado' },
      { a: 'UPDATE', e: 'Cobrança', m: 'Baixa manual de cobrança' },
      { a: 'CREATE', e: 'Morador', m: 'Novo morador cadastrado' },
    ];
    for (let i = 0; i < 15; i++) {
      const act = actions[Math.floor(Math.random() * actions.length)];
      auditData.push({
        condominiumId: condo._id,
        actorId: adminUser._id,
        actorName: adminUser.name,
        action: act.a,
        entity: act.e,
        message: act.m,
        createdAt: generateRandomDate(new Date(now.getTime() - 86400000 * 5), now), // últimos 5 dias
      });
    }
    await AuditLog.insertMany(auditData);
    console.log(`📋 15 Logs de Atividade criados.`);

    console.log('\n✅ AMBIENTE DE DEMONSTRAÇÃO PRONTO!\n');
    console.log('══════════════════════════════════════════════');
    console.log('👤 SÍNDICO');
    console.log('   E-mail : sindicotest@gmail.com');
    console.log('   Senha  : 123456');
    console.log('──────────────────────────────────────────────');
    console.log('🏠 MORADOR (Login de teste)');
    console.log('   E-mail : morador1@teste.com');
    console.log('   Senha  : 123456');
    console.log('══════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('❌ Erro no Demo Seed:', error.message);
    throw error;
  }
};
