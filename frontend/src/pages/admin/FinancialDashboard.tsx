import React from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  Receipt, TrendingDown, Wallet, FileText, Home,
  AlertCircle, CheckCircle2, Clock, ChevronRight, TrendingUp
} from 'lucide-react';
import api from '../../services/api';
import { Charge, Unit } from '../../types';

interface ExpenseData { _id: string; amount: number; date: string; }

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const quickLinks = [
  { to: '/cobrancas', label: 'Cobranças', icon: Receipt, color: 'bg-blue-50 text-blue-700' },
  { to: '/despesas', label: 'Despesas', icon: TrendingDown, color: 'bg-red-50 text-red-700' },
  { to: '/caixa', label: 'Caixa', icon: Wallet, color: 'bg-emerald-50 text-emerald-700' },
  { to: '/relatorios', label: 'Relatórios', icon: FileText, color: 'bg-violet-50 text-violet-700' },
  { to: '/unidades', label: 'Unidades', icon: Home, color: 'bg-indigo-50 text-indigo-700' },
];

const FinancialDashboard: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const { data: charges = [], isLoading: loadingCharges } = useQuery<Charge[]>({
    queryKey: ['charges'],
    queryFn: async () => { const { data } = await api.get('/charges'); return data; }
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery<ExpenseData[]>({
    queryKey: ['expenses'],
    queryFn: async () => { const { data } = await api.get('/expenses'); return data; }
  });

  const { data: units = [], isLoading: loadingUnits } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => { const { data } = await api.get('/units'); return data; }
  });

  if (loadingCharges || loadingExpenses || loadingUnits) return <LoadingSpinner text="Carregando..." />;

  const monthCharges = charges.filter(c => c.referenceMonth === currentMonth);
  const totalReceived = monthCharges.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const totalPending = monthCharges.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const totalLate = charges.filter(c => c.status === 'late').length;
  const monthExpenses = expenses
    .filter(e => e.date?.startsWith(currentMonth))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <PremiumPage
      title="Painel Financeiro"
      subtitle={`Visão geral financeira do condomínio — ${monthLabel}.`}
      onMenuClick={onMenuClick}
    >
      {/* Metric Cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total de Unidades"
          value={units.length}
          helper="cadastradas no condomínio"
          icon={<Home className="h-4 w-4" />}
          iconClass="bg-indigo-100 text-indigo-700"
        />
        <MetricCard
          label="Cobranças do Mês"
          value={monthCharges.length}
          helper={`referência ${monthLabel}`}
          icon={<Receipt className="h-4 w-4" />}
          iconClass="bg-blue-100 text-blue-700"
        />
        <MetricCard
          label="Valor Recebido"
          value={brl(totalReceived)}
          helper="cobranças pagas no mês"
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconClass="bg-emerald-100 text-emerald-700"
          valueClassName="text-emerald-700"
        />
        <MetricCard
          label="Valor a Receber"
          value={brl(totalPending)}
          helper="cobranças pendentes no mês"
          icon={<Clock className="h-4 w-4" />}
          iconClass="bg-amber-100 text-amber-700"
          valueClassName={totalPending > 0 ? 'text-amber-600' : undefined}
        />
        <MetricCard
          label="Em Atraso"
          value={totalLate}
          helper="cobranças vencidas"
          icon={<AlertCircle className="h-4 w-4" />}
          iconClass="bg-red-100 text-red-600"
          valueClassName={totalLate > 0 ? 'text-red-600' : undefined}
        />
        <MetricCard
          label="Despesas do Mês"
          value={brl(monthExpenses)}
          helper={`lançadas em ${monthLabel}`}
          icon={<TrendingDown className="h-4 w-4" />}
          iconClass="bg-slate-100 text-slate-600"
        />
      </section>

      {/* Acesso Rápido */}
      <section className="data-table-wrapper mt-6">
        <div className="data-table-header">
          <div>
            <h2 className="section-title">Acesso Rápido</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Navegue pelas áreas financeiras</p>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 transition hover:border-violet-200 hover:shadow-md"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-sm font-bold text-slate-800 group-hover:text-violet-700">{label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-violet-500" />
            </NavLink>
          ))}
        </div>
      </section>
    </PremiumPage>
  );
};

export default FinancialDashboard;
