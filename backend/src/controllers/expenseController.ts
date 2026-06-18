import { Response } from 'express';
import Expense from '../models/Expense';
import { AuthRequest } from '../middlewares/auth';
import { audit } from '../utils/audit';

const ALLOWED_FIELDS = ['description', 'amount', 'category', 'date', 'status', 'notes'] as const;

const pick = (body: Record<string, unknown>) =>
  ALLOWED_FIELDS.reduce<Record<string, unknown>>((acc, key) => {
    if (key in body) acc[key] = body[key];
    return acc;
  }, {});

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const { category, status, month, limit = '200' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { condominiumId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .limit(Math.min(parseInt(limit), 500));

    res.json({ data: expenses });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar despesas' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const { description, amount, category, date } = req.body;

    if (!description?.trim() || amount === undefined || !category || !date) {
      res.status(400).json({ error: 'Descrição, valor, categoria e data são obrigatórios' });
      return;
    }

    if (amount < 0) {
      res.status(400).json({ error: 'O valor não pode ser negativo' });
      return;
    }

    const data = pick(req.body);
    const expense = await Expense.create({
      ...data,
      condominiumId,
      description: String(description).trim().slice(0, 200),
      amount: Number(amount),
      date: new Date(date),
      createdBy: req.user!._id,
    });

    await audit(req, {
      action: 'CREATE',
      entity: 'Expense',
      entityId: String(expense._id),
      message: `Despesa "${expense.description}" criada (R$ ${expense.amount.toFixed(2)})`,
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar despesa' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const expense = await Expense.findOne({ _id: req.params.id, condominiumId });
    if (!expense) { res.status(404).json({ error: 'Despesa não encontrada' }); return; }

    const data = pick(req.body);
    if (data.amount !== undefined) data.amount = Number(data.amount);
    if (data.date !== undefined) data.date = new Date(data.date as string);
    if (data.description) data.description = String(data.description).trim().slice(0, 200);

    Object.assign(expense, data);
    await expense.save();

    await audit(req, {
      action: 'UPDATE',
      entity: 'Expense',
      entityId: String(expense._id),
      message: `Despesa "${expense.description}" atualizada`,
    });

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, condominiumId });
    if (!expense) { res.status(404).json({ error: 'Despesa não encontrada' }); return; }

    await audit(req, {
      action: 'DELETE',
      entity: 'Expense',
      entityId: String(expense._id),
      message: `Despesa "${expense.description}" excluída`,
    });

    res.json({ message: 'Despesa excluída' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir despesa' });
  }
};
