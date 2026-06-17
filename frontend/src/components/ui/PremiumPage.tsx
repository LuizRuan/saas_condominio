import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Menu } from 'lucide-react';
import TopbarActions from './TopbarActions';

interface PremiumPageProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children: React.ReactNode;
}

const PremiumPage: React.FC<PremiumPageProps> = ({
  eyebrow = 'Administração',
  title,
  subtitle,
  onMenuClick,
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar registros...',
  children,
}) => {
  const hasSearch = typeof searchValue === 'string' && typeof onSearchChange === 'function';

  return (
    <div className="min-h-full bg-[#f5f6fa] text-slate-950">

      {/* ── Sticky topbar ── */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-7">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {hasSearch ? (
            <label className="relative flex min-w-0 flex-1 sm:max-w-[600px]" htmlFor={`${title.toLowerCase().replace(/\s+/g, '-')}-search`}>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id={`${title.toLowerCase().replace(/\s+/g, '-')}-search`}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
          ) : (
            <div className="hidden min-w-0 flex-1 sm:block" />
          )}

          <TopbarActions />
        </div>
      </div>

      {/* ── Page header ── */}
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-blue-500" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-600">
                  {eyebrow}
                </p>
              </div>
              <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
            </div>
            {actions && (
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-7">
        {children}
      </main>
    </div>
  );
};

export default PremiumPage;
