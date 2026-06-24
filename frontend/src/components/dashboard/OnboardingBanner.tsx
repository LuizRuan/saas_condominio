import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Home, Users, Receipt, TrendingDown, Megaphone, CreditCard,
  CheckCircle2, Circle, X, ChevronRight, Sparkles, Star, PlayCircle,
} from 'lucide-react';
import { useOnboardingTour } from '../../hooks/useOnboardingTour';

const DISMISSED_KEY = 'domus_checklist_dismissed_v1';

interface BannerStats {
  toReceive: number;
  receivedThisMonth: number;
  late: number;
  expensesPaidThisMonth: number;
  expensesPending: number;
  totalResidents: number;
}

interface OnboardingBannerProps {
  totalUnits: number;
  stats: BannerStats;
  hasAnnouncements: boolean;
}

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  buttonLabel: string;
  done: boolean;
  /** Itens opcionais não contam para o progresso nem bloqueiam o 100%. */
  optional?: boolean;
}

const OnboardingBanner: React.FC<OnboardingBannerProps> = ({
  totalUnits, stats, hasAnnouncements,
}) => {
  const navigate = useNavigate();
  const { restart: startTour } = useOnboardingTour();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === 'true'; } catch { return false; }
  });

  const hasUnits = totalUnits > 0;
  const hasResidents = stats.totalResidents > 0;
  const hasCharges = (stats.toReceive + stats.receivedThisMonth + stats.late) > 0;
  const hasExpenses = (stats.expensesPaidThisMonth + stats.expensesPending) > 0;

  const steps: Step[] = [
    {
      title: 'Configure os dados do condomínio',
      description: 'Nome, endereço, CNPJ, taxa padrão e chave Pix.',
      icon: Building2,
      link: '/condominio',
      buttonLabel: 'Começar agora',
      done: hasUnits,
    },
    {
      title: 'Cadastre suas unidades',
      description: 'Apartamentos, casas, blocos e status de ocupação.',
      icon: Home,
      link: '/unidades',
      buttonLabel: 'Ir para unidades',
      done: hasUnits,
    },
    {
      title: 'Adicione moradores',
      description: 'Proprietários, inquilinos e responsáveis por unidade.',
      icon: Users,
      link: '/moradores',
      buttonLabel: 'Ir para moradores',
      done: hasResidents,
    },
    {
      title: 'Crie sua primeira cobrança',
      description: 'Individuais ou em massa, com controle de pagamentos.',
      icon: Receipt,
      link: '/cobrancas',
      buttonLabel: 'Ir para cobranças',
      done: hasCharges,
    },
    {
      title: 'Lance uma despesa',
      description: 'Luz, água, segurança, limpeza e outras despesas.',
      icon: TrendingDown,
      link: '/despesas',
      buttonLabel: 'Ir para despesas',
      done: hasExpenses,
    },
    {
      title: 'Publique um comunicado',
      description: 'Envie avisos e informações para os moradores.',
      icon: Megaphone,
      link: '/comunicados',
      buttonLabel: 'Ir para comunicados',
      done: hasAnnouncements,
    },
    {
      title: 'Confira seu plano',
      description: 'Veja limites, uso e opções de upgrade disponíveis.',
      icon: CreditCard,
      link: '/billing',
      buttonLabel: 'Ver plano',
      done: false,
      optional: true,
    },
  ];

  // Progresso calculado apenas sobre itens rastreáveis (não opcionais).
  const tracked = steps.filter((s) => !s.optional);
  const completedCount = tracked.filter((s) => s.done).length;
  const allTrackedDone = completedCount === tracked.length;
  const progress = Math.round((completedCount / tracked.length) * 100);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
    setDismissed(true);
  };

  if (dismissed || allTrackedDone) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200/60 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-violet-100/80 bg-gradient-to-r from-violet-50/80 to-blue-50/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-violet-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-[-0.03em] text-slate-950">
              Comece a organizar seu condomínio
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Siga alguns passos simples para deixar o Domus pronto para uso.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={startTour}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm transition hover:border-violet-400 hover:bg-violet-50"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Fazer tour guiado
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Ocultar checklist"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="border-b border-slate-100 px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500">
            {completedCount} de {tracked.length} etapas concluídas
          </span>
          <span className="text-xs font-black text-violet-600">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-slate-100/80">
        {steps.map((step, idx) => {
          const Icon = step.icon;

          if (step.optional) {
            return (
              <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                <Star className="h-5 w-5 shrink-0 text-amber-400" />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{step.title}</p>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600 ring-1 ring-amber-100">
                      Recomendado
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{step.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(step.link)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700"
                >
                  {step.buttonLabel}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                step.done ? 'opacity-60' : 'hover:bg-slate-50/60'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-300" />
              )}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{step.description}</p>
              </div>
              {!step.done && (
                <button
                  type="button"
                  onClick={() => navigate(step.link)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700"
                >
                  {step.buttonLabel}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
        <p className="text-xs font-medium text-slate-400">
          Você pode refazer o tour guiado a qualquer momento em Configurações.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs font-bold text-slate-400 transition hover:text-slate-600"
        >
          Ocultar checklist
        </button>
      </div>
    </section>
  );
};

export default OnboardingBanner;
