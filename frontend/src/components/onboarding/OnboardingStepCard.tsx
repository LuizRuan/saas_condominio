import React from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { OnboardingStep } from '../../data/onboardingSteps';

interface OnboardingStepCardProps {
  step: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingStepCard: React.FC<OnboardingStepCardProps> = ({
  step, stepIndex, totalSteps, isFirstStep, isLastStep, onPrev, onNext, onSkip,
}) => {
  const Icon = step.icon;
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div
      key={stepIndex}
      className="animate-scale-in pointer-events-auto w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 sm:p-7"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Header: ícone + progresso + fechar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-600/25">
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black tracking-wide text-slate-600">
            {stepIndex + 1} de {totalSteps}
          </span>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Fechar tutorial"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mt-5">
        <h2 id="onboarding-title" className="text-xl font-extrabold tracking-[-0.03em] text-slate-950">
          {step.title}
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          {step.text}
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Ações */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-bold text-slate-400 transition hover:text-slate-600"
        >
          Pular tutorial
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirstStep}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-600/25 transition hover:from-blue-500 hover:to-violet-500"
          >
            {isLastStep ? (
              <>
                Finalizar
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepCard;
