import { useSyncExternalStore, useCallback } from 'react';
import { onboardingSteps } from '../data/onboardingSteps';

/**
 * Chave do localStorage que marca o tutorial como concluído.
 * MVP: controle 100% no cliente. Para migrar ao backend, troque
 * isOnboardingCompleted/markCompleted por leitura/escrita de
 * `user.onboardingCompleted` mantendo a mesma API do hook.
 */
const STORAGE_KEY = 'domus_onboarding_completed_v1';

interface TourState {
  isActive: boolean;
  stepIndex: number;
}

// Store externo mínimo, compartilhado entre o OnboardingTour (no AppLayout)
// e o botão "Rever tutorial" (na página de Configurações).
let state: TourState = { isActive: false, stepIndex: 0 };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: Partial<TourState>) {
  state = { ...state, ...next };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return state;
}

export function isOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // Se o storage estiver indisponível, não insistir no tutorial.
    return true;
  }
}

function markCompleted() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // ignore
  }
}

export function useOnboardingTour() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);

  const total = onboardingSteps.length;

  /** Inicia o tour automaticamente (primeiro acesso). */
  const start = useCallback(() => {
    setState({ isActive: true, stepIndex: 0 });
  }, []);

  /** Reinicia do começo (botão "Rever tutorial"). */
  const restart = useCallback(() => {
    setState({ isActive: true, stepIndex: 0 });
  }, []);

  const next = useCallback(() => {
    if (state.stepIndex < total - 1) {
      setState({ stepIndex: state.stepIndex + 1 });
    } else {
      markCompleted();
      setState({ isActive: false });
    }
  }, [total]);

  const prev = useCallback(() => {
    if (state.stepIndex > 0) {
      setState({ stepIndex: state.stepIndex - 1 });
    }
  }, []);

  const skip = useCallback(() => {
    markCompleted();
    setState({ isActive: false });
  }, []);

  const finish = useCallback(() => {
    markCompleted();
    setState({ isActive: false });
  }, []);

  return {
    isActive: snap.isActive,
    stepIndex: snap.stepIndex,
    totalSteps: total,
    currentStep: onboardingSteps[snap.stepIndex],
    isFirstStep: snap.stepIndex === 0,
    isLastStep: snap.stepIndex === total - 1,
    start,
    restart,
    next,
    prev,
    skip,
    finish,
  };
}
