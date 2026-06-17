import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 text-white">
      {/* Background blobs */}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-600/15 blur-[100px]" />
      <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-blue-600/15 blur-[100px]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 shadow-lg">
            <Building2 className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="leading-none">
            <p className="text-[15px] font-extrabold tracking-[-0.03em] text-white">Condomínio</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300">em Dia</p>
          </div>
        </div>

        {/* 404 Number */}
        <div className="relative mb-4">
          <p className="select-none text-[10rem] font-black leading-none tracking-[-0.06em] text-white/5 sm:text-[14rem]">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl font-black tracking-[-0.06em] text-white/90 sm:text-9xl">404</span>
          </div>
        </div>

        {/* Message */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-300">
          Página não encontrada
        </div>
        <h1 className="mt-3 max-w-md text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
          Ops! Este endereço não existe.
        </h1>
        <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-slate-400">
          A página que você procura pode ter sido movida, removida ou o endereço está incorreto.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500"
          >
            <Home className="h-4 w-4" />
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
