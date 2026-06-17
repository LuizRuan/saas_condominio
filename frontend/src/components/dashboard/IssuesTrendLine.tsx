import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

interface IssuesTrendPoint {
  month: string;
  open: number;
  resolved: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-3 shadow-[0_8px_30px_rgba(76,29,149,0.12)]">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-violet-700">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs font-bold">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="text-slate-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const IssuesTrendLine: React.FC<{ data: IssuesTrendPoint[] }> = ({ data }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
      <div className="border-b border-violet-50 px-5 py-5 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Ocorrências</p>
            <h3 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              Tendência de solicitações
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Abertas vs resolvidas nos últimos 6 meses
            </p>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            {[
              { label: 'Abertas', color: '#f97316' },
              { label: 'Resolvidas', color: '#16a34a' },
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
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="openGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ede9fe', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="open"
              name="Abertas"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#openGradient)"
              dot={{ fill: '#f97316', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#f97316', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="Resolvidas"
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#resolvedGradient)"
              dot={{ fill: '#16a34a', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#16a34a', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IssuesTrendLine;
