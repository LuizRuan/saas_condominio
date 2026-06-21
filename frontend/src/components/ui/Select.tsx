import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

interface SelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  className?: string;
  id?: string;
  title?: string;
  name?: string;
}

const Select: React.FC<SelectProps> = ({
  label, error, options, placeholder, value = '', onChange, disabled = false, className = '', id,
}) => {
  const [open, setOpen] = useState(false);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const selected = options.find(o => o.value === value);

  const openDropdown = useCallback(() => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const itemCount = options.length + (placeholder ? 1 : 0);
    const estimatedH = Math.min(240, itemCount * 44 + 8);
    const minW = Math.max(rect.width, 220);

    const top = rect.bottom + 4 + estimatedH > vh && rect.top > estimatedH + 4
      ? rect.top - estimatedH - 4
      : rect.bottom + 4;

    const left = rect.left + minW > vw - 8
      ? Math.max(8, rect.right - minW)
      : rect.left;

    setDropStyle({ top, left, minWidth: rect.width });
    setOpen(o => !o);
  }, [disabled, options.length, placeholder]);

  // Click-outside: check both the trigger wrapper AND the portal dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        (ref.current && ref.current.contains(target)) ||
        (dropdownRef.current && dropdownRef.current.contains(target))
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (val: string) => {
    onChange?.({ target: { value: val } } as unknown as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  return (
    <div className={`w-full ${className}`} ref={ref}>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-xs font-bold tracking-[-0.01em] text-slate-700">
          {label}
        </label>
      )}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={openDropdown}
        className={[
          'min-h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-inner shadow-slate-900/[0.015] outline-none transition-all',
          'inline-flex items-center justify-between gap-2 text-left',
          open
            ? 'border-blue-500 bg-white ring-4 ring-blue-500/10'
            : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white',
          error ? 'border-red-400' : '',
          disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
        ].filter(Boolean).join(' ')}
      >
        <span className={`truncate font-medium ${selected ? 'text-slate-950' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder ?? 'Selecione'}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', zIndex: 9999, ...dropStyle }}
          className="animate-scale-in w-max max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-[0_8px_32px_rgba(15,23,42,0.12)]"
        >
          {placeholder && (
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50 ${!value ? 'bg-violet-50/60 text-violet-700' : 'text-slate-500'}`}
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
              onClick={() => handleSelect(opt.value)}
              className={`flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50 ${value === opt.value ? 'bg-violet-50/60 text-violet-700' : 'text-slate-700'}`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {value === opt.value && <Check className="h-3.5 w-3.5" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
