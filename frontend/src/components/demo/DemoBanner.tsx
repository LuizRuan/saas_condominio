import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemo } from '../../contexts/DemoContext';
import { useAuth } from '../../contexts/AuthContext';
import { FlaskConical, X, ArrowRight } from 'lucide-react';

const DemoBanner: React.FC = () => {
  const { isDemo } = useDemo();
  const { logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="relative z-50 flex flex-wrap items-center justify-between gap-3 bg-amber-400 px-4 py-2.5 text-amber-950">
      {/* Animated stripe background */}
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
        <button
          onClick={handleCreateAccount}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-900 whitespace-nowrap"
        >
          Criar conta grátis
          <ArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/50 px-3 py-1.5 text-xs font-bold text-amber-950 transition hover:bg-amber-500 whitespace-nowrap border border-amber-950/10"
        >
          Sair da demonstração
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
