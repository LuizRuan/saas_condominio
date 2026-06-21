import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useDemo } from '../../contexts/DemoContext';
import { FlaskConical, X, ArrowRight, ChevronDown, Check } from 'lucide-react';

const ROLE_OPTIONS = [
  { role: 'admin', label: 'Síndico' },
  { role: 'subadmin', label: 'Gestão' },
  { role: 'concierge', label: 'Porteiro' },
  { role: 'financial', label: 'Financeiro' },
  { role: 'resident', label: 'Morador' },
] as const;

const ROLE_HOME: Record<string, string> = {
  admin: '/dashboard',
  subadmin: '/dashboard',
  concierge: '/portaria',
  financial: '/financeiro',
  resident: '/morador/comunicados',
};

const DemoBanner: React.FC = () => {
  const { isDemo, demoRole, setDemoRole } = useDemo();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  if (!isDemo) return null;

  const handleExit = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleCreateAccount = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/cadastro';
  };

  const handleRoleChange = (role: string) => {
    setPickerOpen(false);
    flushSync(() => setDemoRole(role));
    navigate(ROLE_HOME[role] ?? '/dashboard');
  };

  const currentLabel = ROLE_OPTIONS.find(o => o.role === demoRole)?.label ?? 'Síndico';

  return (
    <div className="relative z-50 flex flex-wrap items-center justify-between gap-3 bg-amber-400 px-4 py-2.5 text-amber-950">
      {/* Striped background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.15) 10px, rgba(0,0,0,0.15) 20px)',
        }}
      />

      <div className="relative flex items-center gap-2.5 min-w-0 flex-1">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <p className="text-xs font-bold truncate">
          <span className="hidden sm:inline">🎭 Modo de Demonstração — </span>
          Você está navegando com dados de exemplo. Ações de edição estão desativadas.
        </p>
      </div>

      <div className="relative flex shrink-0 items-center gap-2">
        {/* Role picker */}
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen(o => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-950/15 bg-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-950 transition hover:bg-amber-500/60 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Visualizando como: </span>
            {currentLabel}
            <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${pickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {pickerOpen && (
            <div className="absolute right-0 top-full z-[9999] mt-1.5 min-w-[168px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/15">
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visualizando como</p>
              </div>
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => handleRoleChange(opt.role)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition hover:bg-slate-50 whitespace-nowrap ${demoRole === opt.role ? 'text-violet-700' : 'text-slate-700'}`}
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    {demoRole === opt.role && <Check className="h-3 w-3" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-amber-950/20" />

        <button
          onClick={handleCreateAccount}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-900 whitespace-nowrap"
        >
          Criar conta grátis
          <ArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-950/10 bg-amber-500/50 px-3 py-1.5 text-xs font-bold text-amber-950 transition hover:bg-amber-500 whitespace-nowrap"
        >
          Sair da demonstração
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
