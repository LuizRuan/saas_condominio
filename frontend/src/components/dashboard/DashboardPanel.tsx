import React from 'react';

interface DashboardPanelProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ title, subtitle, icon, children, action }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold tracking-[-0.02em] text-slate-900">{title}</h3>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{subtitle}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    <div className="divide-y divide-slate-100">{children}</div>
  </section>
);

export default DashboardPanel;
