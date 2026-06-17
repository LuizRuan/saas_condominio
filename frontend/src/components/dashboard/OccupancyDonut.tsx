import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface OccupancyData {
  occupied: number;
  empty: number;
  late: number;
  total: number;
}

const COLORS = {
  occupied: '#16a34a',
  empty: '#94a3b8',
  late: '#ef4444',
};

const LABELS: Record<string, string> = {
  occupied: 'Ocupadas',
  empty: 'Vagas',
  late: 'Inadimplentes',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex items-center gap-2 text-xs font-bold">
        <span className="h-2 w-2 rounded-full" style={{ background: item.payload.fill }} />
        <span className="text-slate-500">{LABELS[item.name] || item.name}:</span>
        <span className="text-slate-900">{item.value} unidade(s)</span>
      </div>
    </div>
  );
};

const OccupancyDonut: React.FC<OccupancyData> = ({ occupied, empty, late, total }) => {
  const data = [
    { name: 'occupied', value: occupied },
    { name: 'empty', value: empty },
    { name: 'late', value: late },
  ].filter((d) => d.value > 0);

  const occupancyRate = total > 0 ? Math.round(((occupied + late) / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
      <div className="border-b border-violet-50 px-5 py-5 sm:px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Unidades</p>
        <h3 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
          Ocupação atual
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">
          Distribuição de {total} unidade(s) cadastradas
        </p>
      </div>

      {/* Donut — ResponsiveContainer 100% para nunca cortar */}
      <div className="flex flex-col items-center gap-2 px-6 pb-6 pt-4">
        <div className="relative w-full" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Rótulo central posicionado sobre o SVG */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold tracking-[-0.05em] text-slate-950">
              {occupancyRate}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              ocupação
            </span>
          </div>
        </div>

        {/* Legenda */}
        <div className="w-full space-y-2.5 pt-1">
          {[
            { key: 'occupied', count: occupied, label: 'Ocupadas', color: COLORS.occupied, textColor: 'text-emerald-700' },
            { key: 'late', count: late, label: 'Inadimplentes', color: COLORS.late, textColor: 'text-red-600' },
            { key: 'empty', count: empty, label: 'Vagas', color: COLORS.empty, textColor: 'text-slate-500' },
          ].map(({ key, count, label, color, textColor }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
              <span className="flex-1 text-sm font-semibold text-slate-700">{label}</span>
              <span className={`text-sm font-extrabold ${textColor}`}>{count}</span>
              <span className="w-10 text-right text-xs font-semibold text-slate-400">
                {total > 0 ? `${Math.round((count / total) * 100)}%` : '–'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OccupancyDonut;
