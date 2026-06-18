import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', loading = false,
  icon, className = '', disabled, ...props
}) => {
  const base = 'inline-flex select-none items-center justify-center whitespace-nowrap rounded-xl font-bold tracking-[-0.01em] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-1 active:translate-y-px disabled:pointer-events-none disabled:opacity-50';

  const variants: Record<string, string> = {
    primary: 'border border-violet-700 bg-violet-700 text-white shadow-lg shadow-violet-700/20 hover:border-violet-800 hover:bg-violet-800 hover:shadow-violet-800/25 focus:ring-violet-500/20',
    secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus:ring-slate-500/15',
    danger: 'border border-red-600 bg-red-600 text-white shadow-md shadow-red-600/15 hover:bg-red-700 focus:ring-red-500/20',
    success: 'border border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/15 hover:bg-emerald-700 focus:ring-emerald-500/20',
    ghost: 'border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:ring-slate-500/15',
  };

  const sizes: Record<string, string> = {
    sm: 'min-h-9 px-3.5 py-2 text-xs gap-1.5',
    md: 'min-h-11 px-5 py-2.5 text-sm gap-2',
    lg: 'min-h-12 px-6 py-3 text-sm gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};

export default Button;
