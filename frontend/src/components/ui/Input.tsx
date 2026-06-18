import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', containerClassName = '', id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-xs font-bold tracking-[-0.01em] text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-950 shadow-inner shadow-slate-900/[0.015] outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${icon ? 'pl-11' : ''} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''} ${props.disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500 opacity-75 select-none' : 'bg-slate-50/70 hover:border-slate-300 hover:bg-white'} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
