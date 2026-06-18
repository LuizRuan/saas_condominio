import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'slate' | 'orange';
  subtitle?: string;
  trend?: number; // percentage change, positive = up, negative = down
}

const colorMap: Record<string, {
  bg: string; icon: string; value: string;
  border: string; glow: string; trendUp: string; trendDown: string;
}> = {
  blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',   value: 'text-blue-700',   border: 'border-blue-100/80',   glow: 'shadow-blue-500/8',   trendUp: 'text-blue-600 bg-blue-50',   trendDown: 'text-red-600 bg-red-50' },
  green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600',value: 'text-emerald-700',border: 'border-emerald-100/80',glow: 'shadow-emerald-500/8',trendUp: 'text-emerald-600 bg-emerald-50',trendDown: 'text-red-600 bg-red-50' },
  red:    { bg: 'bg-red-50',     icon: 'text-red-600',    value: 'text-red-700',    border: 'border-red-100/80',    glow: 'shadow-red-500/8',    trendUp: 'text-red-600 bg-red-50',     trendDown: 'text-emerald-600 bg-emerald-50' },
  yellow: { bg: 'bg-amber-50',   icon: 'text-amber-600',  value: 'text-amber-700',  border: 'border-amber-100/80',  glow: 'shadow-amber-500/8',  trendUp: 'text-amber-600 bg-amber-50',  trendDown: 'text-emerald-600 bg-emerald-50' },
  purple: { bg: 'bg-violet-50',  icon: 'text-violet-600', value: 'text-violet-700', border: 'border-violet-100/80', glow: 'shadow-violet-500/8', trendUp: 'text-violet-600 bg-violet-50',trendDown: 'text-red-600 bg-red-50' },
  slate:  { bg: 'bg-slate-100',  icon: 'text-slate-600',  value: 'text-slate-800',  border: 'border-slate-200/80',  glow: 'shadow-slate-400/8',  trendUp: 'text-slate-600 bg-slate-100', trendDown: 'text-red-600 bg-red-50' },
  orange: { bg: 'bg-orange-50',  icon: 'text-orange-600', value: 'text-orange-700', border: 'border-orange-100/80', glow: 'shadow-orange-500/8', trendUp: 'text-orange-600 bg-orange-50', trendDown: 'text-red-600 bg-red-50' },
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color, subtitle, trend }) => {
  const c = colorMap[color];

  const TrendIcon = trend === undefined || trend === 0
    ? Minus
    : trend > 0 ? TrendingUp : TrendingDown;

  const trendClass = trend === undefined || trend === 0
    ? 'text-slate-400 bg-slate-100'
    : trend > 0 ? c.trendUp : c.trendDown;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${c.border}`}>
      {/* Subtle top gradient accent */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${c.bg} opacity-80`} />

      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.icon} transition-transform duration-300 group-hover:scale-105`}>
          {icon}
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold ${trendClass}`}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{title}</p>
        <p className={`mt-1.5 text-2xl font-extrabold tracking-[-0.04em] ${c.value}`}>{value}</p>
        {subtitle && <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
};

export default DashboardCard;
