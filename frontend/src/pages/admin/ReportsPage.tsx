import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';
import { FinanceReport } from '../../types';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { FileText, TrendingUp, TrendingDown, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const categoryLabels: Record<string, string> = {
  utilities: 'Água, luz e gás',
  cleaning: 'Limpeza',
  security: 'Segurança',
  maintenance: 'Manutenção',
  employees: 'Funcionários',
  works: 'Obras',
  providers: 'Prestadores de serviço',
  other: 'Outros',
};

const ReportsPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const { data: report, isLoading } = useQuery<FinanceReport>({
    queryKey: ['finance-report', filterMonth],
    queryFn: async () => {
      const res = await api.get('/finance/reports', { params: { month: filterMonth } });
      return res.data;
    },
  });

  return (
    <PremiumPage
      title="Prestação de Contas"
      subtitle="Relatório gerencial de receitas, despesas e inadimplência."
      eyebrow="Financeiro"
      onMenuClick={onMenuClick}
      actions={
        <div className="flex w-full flex-col sm:w-auto sm:flex-row sm:items-center gap-3">
          <Input 
            type="month" 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)} 
            className="w-full sm:w-auto"
          />
          <button
            type="button"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-800 focus:ring-4 focus:ring-violet-500/20"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinner text="Gerando relatório..." />
      ) : !report ? (
        <div className="mt-8 text-center text-slate-500">Erro ao carregar relatório.</div>
      ) : (
        <div className="mt-6 space-y-6">
          
          {/* Resumo Financeiro */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Receita Realizada"
              value={formatCurrency(report.summary.income)}
              helper={`${formatCurrency(report.summary.pendingIncome)} a receber`}
              icon={<TrendingUp className="h-4 w-4" />}
              iconClass="bg-emerald-100 text-emerald-700"
              valueClassName="text-emerald-700"
            />
            <MetricCard
              label="Despesas Pagas"
              value={formatCurrency(report.summary.expense)}
              helper={`${formatCurrency(report.summary.pendingExpense)} a pagar`}
              icon={<TrendingDown className="h-4 w-4" />}
              iconClass="bg-red-100 text-red-700"
              valueClassName="text-red-600"
            />
            <MetricCard
              label="Saldo do Mês"
              value={formatCurrency(report.summary.balance)}
              helper="Receita - Despesas"
              icon={<FileText className="h-4 w-4" />}
              iconClass="bg-blue-100 text-blue-700"
              valueClassName={report.summary.balance >= 0 ? "text-blue-700" : "text-red-600"}
            />
            <MetricCard
              label="Inadimplência Ativa"
              value={formatCurrency(report.summary.totalLate)}
              helper="Total histórico em atraso"
              icon={<AlertTriangle className="h-4 w-4" />}
              iconClass="bg-amber-100 text-amber-700"
              valueClassName="text-amber-600"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Maiores Despesas */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-base font-extrabold text-slate-900">Distribuição de Despesas</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Gastos do mês agrupados por categoria
                </p>
              </div>
              <div className="p-0">
                {report.expensesByCategory.length === 0 ? (
                  <div className="p-6 text-center text-sm font-medium text-slate-500">
                    Nenhuma despesa paga neste mês.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {report.expensesByCategory.map((exp, idx) => (
                      <li key={idx} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-bold text-xs">
                            {idx + 1}º
                          </div>
                          <span className="font-semibold text-slate-700">
                            {categoryLabels[exp.category] || exp.category}
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(exp.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Inadimplência Detalhada */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-base font-extrabold text-slate-900">Ranking de Inadimplência</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Unidades com maior volume de dívidas ativas
                </p>
              </div>
              <div className="p-0">
                {report.lateUnits.length === 0 ? (
                  <div className="p-6 text-center text-sm font-medium text-slate-500">
                    Nenhuma unidade em atraso. Parabéns! 🎉
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {report.lateUnits.map((unit) => (
                      <li key={unit.unitId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center rounded-lg bg-red-50 px-2.5 py-1 text-sm font-black text-red-600">
                            {unit.block} - {unit.number}
                          </span>
                          <span className="text-sm font-medium text-slate-500">
                            {unit.chargesCount} cobrança(s) em atraso
                          </span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className="font-extrabold text-red-600">
                            {formatCurrency(unit.totalDebt)}
                          </span>
                          <StatusBadge status="late" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

        </div>
      )}
    </PremiumPage>
  );
};

export default ReportsPage;
