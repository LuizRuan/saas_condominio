import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CashflowEntry } from '../../types';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { Wallet, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from 'recharts';

const formatCurrencyShort = (value: number) => {
  if (Math.abs(value) >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs font-bold">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.fill || entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="text-slate-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const CashflowPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();

  const { data, isLoading, refetch, isRefetching } = useQuery<{ cashflow: CashflowEntry[] }>({
    queryKey: ['cashflow'],
    queryFn: async () => {
      const res = await api.get('/finance/cashflow');
      return res.data;
    },
  });

  const cashflow = data?.cashflow || [];
  
  const currentMonthData = useMemo(() => {
    if (!cashflow.length) return { income: 0, expense: 0, balance: 0 };
    return cashflow[cashflow.length - 1]; // Current month is the last in the array
  }, [cashflow]);

  if (isLoading) return <LoadingSpinner text="Calculando fluxo de caixa..." />;

  return (
    <PremiumPage
      title="Fluxo de Caixa"
      subtitle="Acompanhe as entradas e saídas e a saúde financeira do condomínio."
      eyebrow="Financeiro"
      onMenuClick={onMenuClick}
      actions={
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      }
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Entradas (Mês Atual)"
          value={formatCurrency(currentMonthData.income)}
          icon={<TrendingUp className="h-4 w-4" />}
          iconClass="bg-emerald-100 text-emerald-700"
          valueClassName="text-emerald-700"
        />
        <MetricCard
          label="Saídas (Mês Atual)"
          value={formatCurrency(currentMonthData.expense)}
          icon={<TrendingDown className="h-4 w-4" />}
          iconClass="bg-red-100 text-red-700"
          valueClassName="text-red-600"
        />
        <MetricCard
          label="Saldo do Mês"
          value={formatCurrency(currentMonthData.balance)}
          icon={<Wallet className="h-4 w-4" />}
          iconClass="bg-blue-100 text-blue-700"
          valueClassName={currentMonthData.balance >= 0 ? "text-blue-700" : "text-red-600"}
        />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-extrabold text-slate-900">Evolução do Fluxo de Caixa</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Comparativo de receitas e despesas nos últimos 6 meses
          </p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={cashflow} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrencyShort} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }} />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      
      {/* Saldo líquido bar chart */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-extrabold text-slate-900">Resultado Líquido</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Saldo final (Entradas - Saídas) de cada mês
          </p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cashflow} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrencyShort} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="balance" name="Saldo Líquido">
                {cashflow.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.balance >= 0 ? '#3b82f6' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </PremiumPage>
  );
};

export default CashflowPage;
