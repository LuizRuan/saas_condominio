import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Compute visible pages: always show first, last, current ±1
  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const btnBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-transparent px-2.5 text-sm font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40';
  const btnActive = 'border-violet-200 bg-violet-700 text-white shadow-sm shadow-violet-700/30';
  const btnInactive = 'text-slate-500 hover:border-violet-100 hover:bg-violet-50 hover:text-violet-700';
  const btnNav = `${btnBase} border-violet-100 bg-white text-slate-500 shadow-sm hover:border-violet-200 hover:text-violet-700`;

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 border-t border-violet-100/80 px-5 py-4 sm:flex-row sm:px-7 ${className}`}
    >
      {/* Counter */}
      <p className="text-xs font-bold text-slate-500">
        Mostrando <span className="text-slate-800">{from}–{to}</span> de{' '}
        <span className="text-slate-800">{total}</span> registros
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={btnNav}
          aria-label="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={btnNav}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPages().map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-sm font-bold text-slate-300">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
                aria-label={`Ir para página ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={btnNav}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className={btnNav}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
