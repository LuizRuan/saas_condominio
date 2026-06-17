import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ReactNode;
  iconClass?: string;
  valueClassName?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  helper,
  icon,
  iconClass = 'bg-slate-100 text-slate-600',
  valueClassName = 'text-slate-950',
}) => (
  <article className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
      {icon}
    </span>
    <div className="min-w-0">
      <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className={`mt-0.5 truncate text-xl font-extrabold tracking-[-0.04em] ${valueClassName}`}>{value}</p>
      {helper && <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{helper}</p>}
    </div>
  </article>
);

export default MetricCard;
