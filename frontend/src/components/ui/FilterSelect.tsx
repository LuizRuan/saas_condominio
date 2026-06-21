import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  value, onChange, options, placeholder, className = '', disabled,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  const isActive = !!value;

  useLayoutEffect(() => {
    if (!open || !dropdownRef.current) return;
    const el = dropdownRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      el.style.left = 'auto';
      el.style.right = '0';
    } else {
      el.style.left = '';
      el.style.right = '';
    }
  }, [open]);

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
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={[
          'inline-flex h-10 min-w-[160px] items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-4',
          isActive
            ? 'border-violet-300 bg-violet-50 text-violet-700 shadow-violet-100/50 focus:ring-violet-500/15'
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 focus:ring-blue-500/10',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? 'Selecione'}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div ref={dropdownRef} className="animate-scale-in absolute left-0 top-full z-50 mt-1.5 w-max min-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-[0_8px_32px_rgba(15,23,42,0.12)]">
          {placeholder && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50
                ${!value ? 'bg-violet-50/60 text-violet-700' : 'text-slate-500'}`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {!value && <Check className="h-3.5 w-3.5" />}
              </span>
              {placeholder}
            </button>
          )}
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50
                ${value === opt.value ? 'bg-violet-50/60 text-violet-700' : 'text-slate-700'}`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {value === opt.value && <Check className="h-3.5 w-3.5" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterSelect;
