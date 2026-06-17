import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';

interface RevenueDataPoint {
  month: string;
  received: number;
  pending: number;
  late: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

const formatCurrencyShort = (value: number) => {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-3 shadow-[0_8px_30px_rgba(76,29,149,0.12)]">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-violet-700">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs font-bold">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.fill || entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
      <div className="border-b border-violet-50 px-5 py-5 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Financeiro</p>
            <h3 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              Receita mensal
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Últimos 6 meses — recebido, pendente e em atraso
            </p>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            {[
              { label: 'Recebido', color: '#16a34a' },
              { label: 'Pendente', color: '#3b82f6' },
              { label: 'Atrasado', color: '#ef4444' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barCategoryGap="28%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrencyShort}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.04)', radius: 8 }} />
            <Bar dataKey="received" name="Recebido" radius={[6, 6, 0, 0]} fill="#16a34a" />
            <Bar dataKey="pending" name="Pendente" radius={[6, 6, 0, 0]} fill="#3b82f6" />
            <Bar dataKey="late" name="Atrasado" radius={[6, 6, 0, 0]} fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
