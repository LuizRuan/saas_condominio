import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingTour, isOnboardingCompleted } from '../../hooks/useOnboardingTour';
import OnboardingStepCard from './OnboardingStepCard';

const HIGHLIGHT_CLASS = 'onboarding-highlight';

function clearHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
}

const OnboardingTour: React.FC = () => {
  const { user, isAdmin, isDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isActive, stepIndex, totalSteps, currentStep,
    isFirstStep, isLastStep, start, next, prev, skip,
  } = useOnboardingTour();

  const autoStartedRef = useRef(false);

  // Auto-start no primeiro acesso — apenas síndico/gestão, não-demo, não concluído.
  // O guard `isActive` evita reiniciar do zero quando o AppLayout remonta ao
  // cruzar grupos de rota (AdminRoute → FinancialRoute → StaffRoute) durante o tour.
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!user || isDemo || !isAdmin) return;
    if (isActive) return;
    if (isOnboardingCompleted()) return;
    autoStartedRef.current = true;
    start();
  }, [user, isAdmin, isDemo, isActive, start]);

  // Navega para a rota da etapa atual.
  useEffect(() => {
    if (!isActive || !currentStep) return;
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex]);

  // Destaca o item de menu correspondente, quando presente no DOM.
  useEffect(() => {
    if (!isActive || !currentStep) {
      clearHighlights();
      return;
    }
    clearHighlights();
    const el = document.querySelector(`[data-tour="${currentStep.route}"]`);
    if (el) {
      el.classList.add(HIGHLIGHT_CLASS);
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    return clearHighlights;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex]);

  // Limpa destaques ao desmontar.
  useEffect(() => clearHighlights, []);

  if (!isActive || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      {/* Overlay escuro translúcido */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] animate-fade-in" />

      {/* Card */}
      <div className="relative z-[61] flex w-full justify-center">
        <OnboardingStepCard
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrev={prev}
          onNext={next}
          onSkip={skip}
        />
      </div>
    </div>
  );
};

export default OnboardingTour;
