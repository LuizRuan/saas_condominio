import { Response } from 'express';
import Charge from '../models/Charge';
import Expense from '../models/Expense';
import { AuthRequest } from '../middlewares/auth';
import mongoose from 'mongoose';

export const getCashflow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;

    // Get last 6 months + current month
    const now = new Date();
    const months: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const [receivedByMonth, expensesByMonth] = await Promise.all([
      // Aggregating paid charges
      Charge.aggregate([
        { $match: { condominiumId, status: 'paid', referenceMonth: { $in: months } } },
        { $group: { _id: '$referenceMonth', total: { $sum: '$amount' } } },
      ]),
      // Aggregating paid expenses
      // For expenses, we'll format the paid date to YYYY-MM
      Expense.aggregate([
        {
          $match: {
            condominiumId,
            status: 'paid',
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1),
              $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const toMap = (arr: any[]) => Object.fromEntries(arr.map((x) => [x._id, x.total]));
    const receivedMap = toMap(receivedByMonth);
    const expensesMap = toMap(expensesByMonth);

    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const cashflow = months.map((m) => {
      const [year, month] = m.split('-');
      const label = `${monthLabels[parseInt(month, 10) - 1]} ${year.substring(2)}`;
      const income = receivedMap[m] || 0;
      const expense = expensesMap[m] || 0;
      return {
        month: m,
        label,
        income,
        expense,
        balance: income - expense,
      };
    });

    res.json({ cashflow });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao carregar fluxo de caixa', details: error.message });
  }
};

export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const { month } = req.query; // format: YYYY-MM
    
    let targetMonthStr = String(month || '');
    if (!/^\d{4}-\d{2}$/.test(targetMonthStr)) {
      const now = new Date();
      targetMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const [yearStr, monthStr] = targetMonthStr.split('-');
    const year = parseInt(yearStr, 10);
    const mInt = parseInt(monthStr, 10) - 1;
    
    const startDate = new Date(year, mInt, 1);
    const endDate = new Date(year, mInt + 1, 0, 23, 59, 59);

    const [
      paidCharges,
      pendingCharges,
      lateCharges,
      paidExpenses,
      pendingExpenses,
      topExpenses,
      lateUnitsList,
    ] = await Promise.all([
      // Total recebido no mês de referência
      Charge.aggregate([
        { $match: { condominiumId, status: 'paid', referenceMonth: targetMonthStr } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Total a receber no mês de referência
      Charge.aggregate([
        { $match: { condominiumId, status: 'pending', referenceMonth: targetMonthStr } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Total inadimplente (todo histórico ou mês específico? Vamos usar todo histórico ativo)
      Charge.aggregate([
        { $match: { condominiumId, status: 'late' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Despesas pagas neste mês
      Expense.aggregate([
        { $match: { condominiumId, status: 'paid', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Despesas previstas para este mês (pendentes com data no mês)
      Expense.aggregate([
        { $match: { condominiumId, status: 'pending', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Top despesas do mês por categoria
      Expense.aggregate([
        { $match: { condominiumId, status: 'paid', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      // Unidades inadimplentes detalhadas
      Charge.aggregate([
        { $match: { condominiumId, status: 'late' } },
        { $group: { _id: '$unitId', totalDebt: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $lookup: { from: 'units', localField: '_id', foreignField: '_id', as: 'unit' } },
        { $unwind: '$unit' },
        { $sort: { totalDebt: -1 } },
        { $limit: 10 },
      ])
    ]);

    const income = paidCharges[0]?.total || 0;
    const expense = paidExpenses[0]?.total || 0;

    res.json({
      month: targetMonthStr,
      summary: {
        income,
        expense,
        balance: income - expense,
        pendingIncome: pendingCharges[0]?.total || 0,
        pendingExpense: pendingExpenses[0]?.total || 0,
        totalLate: lateCharges[0]?.total || 0,
      },
      expensesByCategory: topExpenses.map((t) => ({ category: t._id, amount: t.total })),
      lateUnits: lateUnitsList.map((u) => ({
        unitId: u._id,
        block: u.unit.block,
        number: u.unit.number,
        totalDebt: u.totalDebt,
        chargesCount: u.count,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
  }
};
