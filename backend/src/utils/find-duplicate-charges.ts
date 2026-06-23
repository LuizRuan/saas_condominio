/**
 * Script SOMENTE LEITURA — diagnóstico de cobranças duplicadas.
 *
 * Localiza cobranças duplicadas agrupando por { condominiumId, unitId, referenceMonth }
 * e relata apenas os grupos com mais de uma cobrança. NÃO altera, apaga ou cria
 * nenhum dado — usa exclusivamente aggregate (leitura).
 *
 * Uso (dentro da pasta backend):
 *   npx tsx src/utils/find-duplicate-charges.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Charge from '../models/Charge';

dotenv.config();

interface DuplicateGroup {
  _id: {
    condominiumId: mongoose.Types.ObjectId;
    unitId: mongoose.Types.ObjectId;
    referenceMonth: string;
  };
  count: number;
  charges: Array<{
    id: mongoose.Types.ObjectId;
    status: string;
    amount: number;
    dueDate: Date | null;
    createdAt: Date | null;
  }>;
  condo: Array<{ name?: string }>;
  unit: Array<{ block?: string; number?: string }>;
}

const formatBRL = (value: number): string =>
  (typeof value === 'number' ? value : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const formatDate = (date: Date | null): string =>
  date ? new Date(date).toISOString() : '—';

const run = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI (ou MONGODB_URI) não definida no ambiente (.env).');
  }

  await mongoose.connect(mongoURI);
  console.log('✅ Conectado ao MongoDB (modo SOMENTE LEITURA)\n');

  // Agrupa por condomínio + unidade + mês de referência; mantém só grupos com count > 1.
  // $lookup traz nome do condomínio e dados da unidade apenas para exibição.
  const groups = await Charge.aggregate<DuplicateGroup>([
    {
      $group: {
        _id: {
          condominiumId: '$condominiumId',
          unitId: '$unitId',
          referenceMonth: '$referenceMonth',
        },
        count: { $sum: 1 },
        charges: {
          $push: {
            id: '$_id',
            status: '$status',
            amount: '$amount',
            dueDate: '$dueDate',
            createdAt: '$createdAt',
          },
        },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    {
      $lookup: {
        from: 'condominiums',
        localField: '_id.condominiumId',
        foreignField: '_id',
        as: 'condo',
      },
    },
    {
      $lookup: {
        from: 'units',
        localField: '_id.unitId',
        foreignField: '_id',
        as: 'unit',
      },
    },
  ]);

  if (groups.length === 0) {
    console.log('🎉 Nenhuma cobrança duplicada encontrada por {condominiumId, unitId, referenceMonth}.');
    return;
  }

  const affectedCondos = new Set<string>();
  let totalExcess = 0;

  console.log(`⚠️  ${groups.length} grupo(s) de cobranças duplicadas encontrado(s):\n`);

  groups.forEach((group, index) => {
    const condoName = group.condo[0]?.name ?? '(condomínio não encontrado)';
    const unit = group.unit[0];
    const unitLabel = unit
      ? `${unit.block ? `Bloco ${unit.block} - ` : ''}Apt ${unit.number ?? '—'}`
      : '(unidade não encontrada)';
    const excess = group.count - 1;
    totalExcess += excess;
    affectedCondos.add(String(group._id.condominiumId));

    console.log(`#${index + 1} ─────────────────────────────────────────────`);
    console.log(`  Condomínio  : ${condoName} (${group._id.condominiumId})`);
    console.log(`  Unidade     : ${unitLabel} (${group._id.unitId})`);
    console.log(`  Mês ref.    : ${group._id.referenceMonth}`);
    console.log(`  Cobranças   : ${group.count} (excedentes: ${excess})`);
    group.charges.forEach((c) => {
      console.log(
        `    - _id=${c.id} | status=${c.status} | valor=${formatBRL(c.amount)} | ` +
        `venc=${formatDate(c.dueDate)} | criada=${formatDate(c.createdAt)}`,
      );
    });
    console.log('');
  });

  console.log('═══════════════ RESUMO ═══════════════');
  console.log(`  Grupos duplicados        : ${groups.length}`);
  console.log(`  Cobranças excedentes     : ${totalExcess}`);
  console.log(`  Condomínios afetados     : ${affectedCondos.size}`);
  console.log('══════════════════════════════════════');
  console.log('\nℹ️  Nenhum dado foi alterado — este script é somente leitura.');
};

run()
  .catch((err) => {
    console.error('❌ Erro ao diagnosticar cobranças duplicadas:', err?.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Conexão com o MongoDB encerrada.');
  });
