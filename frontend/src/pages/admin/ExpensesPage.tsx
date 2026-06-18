import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import {
  AlertCircle, BadgeDollarSign, CheckCircle2, Clock3,
  Pencil, Plus, Trash2, TrendingDown, Wallet,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import api from '../../services/api';
import { Expense, ExpenseCategory } from '../../types';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const categoryOptions = [
  { value: 'utilities', label: 'Água, luz e gás' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'security', label: 'Segurança' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'employees', label: 'Funcionários' },
  { value: 'works', label: 'Obras' },
  { value: 'providers', label: 'Prestadores de serviço' },
  { value: 'other', label: 'Outro' },
];

const categoryLabels: Record<ExpenseCategory, string> = {
  utilities: 'Água, luz e gás',
  cleaning: 'Limpeza',
  security: 'Segurança',
  maintenance: 'Manutenção',
  employees: 'Funcionários',
  works: 'Obras',
  providers: 'Prestadores de serviço',
  other: 'Outro',
};

const categoryColors: Record<ExpenseCategory, string> = {
  utilities: 'bg-blue-100 text-blue-700',
  cleaning: 'bg-emerald-100 text-emerald-700',
  security: 'bg-orange-100 text-orange-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  employees: 'bg-purple-100 text-purple-700',
  works: 'bg-rose-100 text-rose-700',
  providers: 'bg-indigo-100 text-indigo-700',
  other: 'bg-slate-100 text-slate-600',
};

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
];

const emptyForm = {
  description: '',
  amount: '',
  category: 'maintenance' as ExpenseCategory,
  date: new Date().toISOString().split('T')[0],
  status: 'pending' as 'pending' | 'paid',
  notes: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const ExpensesPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const queryClient = useQueryClient();

  // ── Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [search, setSearch] = useState('');

  // ── Modal / form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // ── Data
  const { data: expensesResponse, isLoading: loading } = useQuery<{ data: Expense[] }>({
    queryKey: ['expenses', filterCategory, filterStatus, filterMonth],
    queryFn: async () => {
      const { data } = await api.get('/expenses', {
        params: {
          category: filterCategory || undefined,
          status: filterStatus || undefined,
          month: filterMonth || undefined,
          limit: 500,
        },
      });
      return data;
    },
  });
  const expenses: Expense[] = expensesResponse?.data ?? [];

  // ── Derived stats
  const totalAmount = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const paidAmount = useMemo(() => expenses.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0), [expenses]);
  const pendingAmount = useMemo(() => expenses.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0), [expenses]);
  const pendingCount = useMemo(() => expenses.filter((e) => e.status === 'pending').length, [expenses]);

  // ── Client-side search
  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) =>
      [e.description, categoryLabels[e.category], e.notes].some((v) => v?.toLowerCase().includes(q))
    );
  }, [expenses, search]);

  // ── Actions
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date.split('T')[0],
      status: expense.status,
      notes: expense.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error('Informe a descrição'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Informe um valor válido'); return; }
    if (!form.date) { toast.error('Informe a data'); return; }

    setSaving(true);
    try {
      const payload = {
        description: form.description.trim(),
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        status: form.status,
        notes: form.notes.trim(),
      };

      if (editing) {
        await api.put(`/expenses/${editing._id}`, payload);
        toast.success('Despesa atualizada!');
      } else {
        await api.post('/expenses', payload);
        toast.success('Despesa cadastrada!');
      }

      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/expenses/${deleteTarget._id}`);
      toast.success('Despesa excluída!');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao excluir');
    } finally {
      setSaving(false);
    }
  };

  // ── Render
  return (
    <PremiumPage
      title="Despesas"
      subtitle="Controle financeiro das despesas do condomínio por categoria."
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por descrição ou categoria..."
      actions={(
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto">
          Nova despesa
        </Button>
      )}
    >
      {/* Metric Cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total do período"
          value={formatCurrency(totalAmount)}
          helper="soma de todas as despesas"
          icon={<Wallet className="h-4 w-4" />}
          iconClass="bg-slate-100 text-slate-600"
        />
        <MetricCard
          label="Pagas"
          value={formatCurrency(paidAmount)}
          helper={`${expenses.filter((e) => e.status === 'paid').length} despesas`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconClass="bg-emerald-100 text-emerald-700"
          valueClassName="text-emerald-700"
        />
        <MetricCard
          label="Pendentes"
          value={formatCurrency(pendingAmount)}
          helper={`${pendingCount} despesas`}
          icon={<Clock3 className="h-4 w-4" />}
          iconClass="bg-orange-100 text-orange-700"
          valueClassName="text-orange-600"
        />
        <MetricCard
          label="Categorias"
          value={new Set(expenses.map((e) => e.category)).size}
          helper="diferentes no período"
          icon={<TrendingDown className="h-4 w-4" />}
          iconClass="bg-blue-100 text-blue-700"
        />
      </section>

      {/* Filters */}
      <section className="mt-6 flex flex-wrap gap-3">
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          options={[{ value: '', label: 'Todas as categorias' }, ...categoryOptions]}
          className="min-w-[200px]"
        />
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[{ value: '', label: 'Todos os status' }, ...statusOptions]}
        />
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          placeholder="Mês"
        />
      </section>

      {/* Table */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200" style={{ borderTopColor: '#2563eb' }} />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <BadgeDollarSign className="h-7 w-7" />
            </span>
            <p className="text-sm font-semibold text-slate-500">
              {search || filterCategory || filterStatus || filterMonth ? 'Nenhuma despesa encontrada para os filtros aplicados.' : 'Nenhuma despesa cadastrada ainda.'}
            </p>
            {!search && !filterCategory && !filterStatus && !filterMonth && (
              <Button size="sm" variant="secondary" onClick={openCreate} icon={<Plus className="h-3.5 w-3.5" />}>
                Cadastrar primeira despesa
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Data</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Descrição</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Categoria</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Valor</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="group transition hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">{expense.description}</p>
                      {expense.notes && <p className="mt-0.5 text-xs text-slate-400">{expense.notes}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${categoryColors[expense.category]}`}>
                        {categoryLabels[expense.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(expense.amount)}</span>
                    </td>
                    <td className="px-5 py-4">
                      {expense.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 ring-1 ring-orange-200">
                          <AlertCircle className="h-3 w-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEdit(expense)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(expense)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer totals */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-xs text-slate-500">{filteredExpenses.length} despesas</span>
              <span className="text-sm font-bold text-slate-800">
                Total: {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar despesa' : 'Nova despesa'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Descrição *</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ex: Conta de energia - maio"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Valor (R$) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Data *</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Categoria *</label>
            <Select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
              options={categoryOptions}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label>
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'pending' | 'paid' }))}
              options={statusOptions}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Observações</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Nota fiscal, fornecedor, referência..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editing ? 'Salvar alterações' : 'Cadastrar despesa'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Excluir despesa"
        description={`Deseja excluir a despesa "${deleteTarget?.description}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={saving}
        confirmLabel="Excluir"
      />
    </PremiumPage>
  );
};

export default ExpensesPage;
