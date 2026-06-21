import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTHS_LONG = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface FilterMonthProps {
  value: string; // YYYY-MM or ''
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const FilterMonth: React.FC<FilterMonthProps> = ({
  value, onChange, placeholder = 'Filtrar por mês', className = '',
}) => {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [year, setYear] = useState(() =>
    value ? parseInt(value.split('-')[0]) : now.getFullYear()
  );
  const ref = useRef<HTMLDivElement>(null);

  const selYear = value ? parseInt(value.split('-')[0]) : null;
  const selMonth = value ? parseInt(value.split('-')[1]) - 1 : null;
  const label = value
    ? `${MONTHS_LONG[parseInt(value.split('-')[1]) - 1]} ${value.split('-')[0]}`
    : null;

  useEffect(() => {
    if (value) setYear(parseInt(value.split('-')[0]));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setAlignRight(rect.left + 256 > window.innerWidth - 8);
          }
          setOpen(o => !o);
        }}
        className={[
          'inline-flex h-10 min-w-[190px] items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-4',
          value
            ? 'border-violet-300 bg-violet-50 text-violet-700 shadow-violet-100/50 focus:ring-violet-500/15'
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 focus:ring-blue-500/10',
        ].join(' ')}
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left">{label ?? placeholder}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onChange(''); } }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-violet-200"
            aria-label="Limpar filtro"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div className={`animate-scale-in absolute top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.12)] ${alignRight ? 'right-0' : 'left-0'}`}>
          {/* Year navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <button
              type="button"
              onClick={() => setYear(y => y - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              aria-label="Ano anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-extrabold text-slate-900">{year}</span>
            <button
              type="button"
              onClick={() => setYear(y => y + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              aria-label="Próximo ano"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1 p-3">
            {MONTHS_SHORT.map((m, i) => {
              const isSel = selYear === year && selMonth === i;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChange(`${year}-${String(i + 1).padStart(2, '0')}`);
                    setOpen(false);
                  }}
                  className={`rounded-xl py-2.5 text-xs font-bold transition-all
                    ${isSel
                      ? 'bg-violet-700 text-white shadow-sm shadow-violet-700/25'
                      : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {value && (
            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full rounded-xl py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
              >
                Limpar filtro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterMonth;
