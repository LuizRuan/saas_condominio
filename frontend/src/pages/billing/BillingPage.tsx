import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, AlertCircle, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PricingCard from '../../components/billing/PricingCard';
import { PLAN_DEFINITIONS, PlanKey } from '../../config/plans';

interface BillingData {
  plan: string;
  subscriptionStatus: string | null;
  billingCycle: string | null;
  currentPeriodEnd: string | null;
  gateway: string | null;
  subscription: {
    status: string;
    plan: string;
    billingCycle: string;
    amount: number;
    currentPeriodEnd: string | null;
    rawStatus: string | null;
    createdAt: string;
  } | null;
}

type CtaMode =
  | 'subscribe'
  | 'current'
  | 'inferior'
  | 'upgrade'
  | 'blocked-pending'
  | 'blocked-active'
  | 'free-current'
  | 'free-inferior';

function getFreeCta(plan: string): CtaMode {
  return plan === 'free' ? 'free-current' : 'free-inferior';
}

function getProCta(plan: string, sub: BillingData['subscription'] | null): CtaMode {
  if (!sub) return 'subscribe';
  if (plan === 'pro' && sub.status === 'active') return 'current';
  if (plan === 'ultra') return 'inferior';
  if (sub.status === 'pending') return 'blocked-pending';
  return 'blocked-active';
}

function getUltraCta(plan: string, sub: BillingData['subscription'] | null): CtaMode {
  if (!sub) return 'subscribe';
  if (plan === 'ultra') return 'current';
  if (plan === 'pro' && sub.status === 'active') return 'upgrade';
  if (sub.status === 'pending') return 'blocked-pending';
  return 'blocked-active';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  pending: 'Pendente de ativação',
  overdue: 'Pagamento em atraso',
  canceled: 'Cancelado',
  failed: 'Falhou',
};

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  pending: 'bg-amber-500/15 text-amber-400',
  overdue: 'bg-orange-500/15 text-orange-400',
  canceled: 'bg-slate-500/15 text-slate-400',
  failed: 'bg-red-500/15 text-red-400',
};

const BillingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState<PlanKey | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [highlightPlan, setHighlightPlan] = useState<PlanKey | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BillingData>({
    queryKey: ['billing', 'me'],
    queryFn: () => api.get('/billing/me').then((r) => r.data),
  });

  // Consome o plano/ciclo escolhidos na landing (query param, com fallback no
  // localStorage), pré-seleciona o ciclo, destaca o plano e limpa o pendingPlan.
  useEffect(() => {
    let plan: string | null = searchParams.get('plan');
    let cycle: string | null = searchParams.get('cycle');

    if (!plan || !cycle) {
      try {
        const raw = localStorage.getItem('pendingPlan');
        if (raw) {
          const p = JSON.parse(raw);
          const valid = !p.expiresAt || Date.now() <= p.expiresAt;
          if (valid) {
            plan = plan || p.plan;
            cycle = cycle || p.billingCycle;
          }
        }
      } catch {
        // ignore JSON inválido
      }
    }

    if (cycle === 'yearly') setIsAnnual(true);
    else if (cycle === 'monthly') setIsAnnual(false);

    if (plan === 'pro' || plan === 'ultra') setHighlightPlan(plan);

    // Informação consumida: limpa o pendente e os params da URL.
    localStorage.removeItem('pendingPlan');
    if (searchParams.has('plan') || searchParams.has('cycle')) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rola até o plano destacado e remove o realce após alguns segundos.
  useEffect(() => {
    if (!highlightPlan || isLoading) return;
    const el = document.querySelector(`[data-plan-card="${highlightPlan}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setHighlightPlan(null), 2600);
    return () => clearTimeout(t);
  }, [highlightPlan, isLoading]);

  const hasActiveOrPendingSubscription = !!(
    data?.subscription &&
    ['active', 'pending', 'overdue'].includes(data.subscription.status)
  );
  const isPendingSubscription = data?.subscription?.status === 'pending';
  const showCancelButton = hasActiveOrPendingSubscription;
  const cancelButtonLabel = isPendingSubscription ? 'Cancelar solicitação' : 'Cancelar assinatura';
  const showCanceledBanner =
    !hasActiveOrPendingSubscription &&
    (data?.subscriptionStatus === 'canceled' || data?.subscriptionStatus === 'failed');

  const proCta  = getProCta(data?.plan ?? 'free',  data?.subscription ?? null);
  const ultraCta = getUltraCta(data?.plan ?? 'free', data?.subscription ?? null);

  const handleSubscribe = async (plan: PlanKey) => {
    setSubscribeLoading(plan);
    try {
      const res = await api.post('/billing/mercadopago/subscribe', {
        plan,
        billingCycle: isAnnual ? 'yearly' : 'monthly',
      });
      window.location.href = res.data.checkoutUrl;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao criar assinatura.');
    } finally {
      setSubscribeLoading(null);
    }
  };

  const handleCancelConfirm = async () => {
    setCancelLoading(true);
    try {
      await api.post('/billing/mercadopago/cancel');
      toast.success(isPendingSubscription ? 'Solicitação cancelada.' : 'Assinatura cancelada com sucesso.');
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      toast.error(msg || (isPendingSubscription ? 'Erro ao cancelar solicitação. Tente novamente.' : 'Erro ao cancelar assinatura. Tente novamente.'));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCancelFromUpgradeModal = async () => {
    setCancelLoading(true);
    try {
      await api.post('/billing/mercadopago/cancel');
      toast.success('Assinatura Pro cancelada. Agora você pode contratar o Ultra.');
      setShowUpgradeModal(false);
      queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      toast.error(msg || 'Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-red-400">
          <AlertCircle className="h-5 w-5" />
          Erro ao carregar informações do plano. Recarregue a página.
        </div>
      </div>
    );
  }

  const planName = data.plan === 'ultra' ? 'Ultra' : data.plan === 'pro' ? 'Pro' : 'Grátis';

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">Plano e assinatura</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Gerencie seu plano do Domus.</p>
      </div>

      {/* Card: plano atual */}
      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Plano atual</p>
              <p className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-950">{planName}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.subscription?.status && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[data.subscription.status] ?? 'bg-slate-100 text-slate-500'}`}>
                {STATUS_LABEL[data.subscription.status] ?? data.subscription.status}
              </span>
            )}
            {data.subscription?.billingCycle && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {data.subscription.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
              </span>
            )}
          </div>
        </div>

        {data.currentPeriodEnd && (
          <p className="mt-4 text-sm font-medium text-slate-500">
            Próxima renovação: <strong className="text-slate-700">{formatDate(data.currentPeriodEnd)}</strong>
          </p>
        )}

        {showCancelButton && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-sm font-bold text-red-500 transition hover:text-red-700"
            >
              {cancelButtonLabel}
            </button>
          </div>
        )}
      </div>

      {/* Banner: assinatura pendente */}
      {isPendingSubscription && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Existe uma assinatura pendente de ativação. Cancele a solicitação ou aguarde a confirmação pelo Mercado Pago.
        </div>
      )}

      {/* Banner: Ultra ativo — plano máximo */}
      {data.plan === 'ultra' && data.subscription &&
        ['active', 'overdue'].includes(data.subscription.status) && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Você já está no plano mais completo.
        </div>
      )}

      {/* Banner: assinatura cancelada/falhou */}
      {showCanceledBanner && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          Sua assinatura anterior foi cancelada. Você pode contratar um novo plano abaixo.
        </div>
      )}

      {/* Toggle Mensal/Anual */}
      <div className="flex justify-center">
        <div className="flex max-w-fit items-center gap-4 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${!isAnnual ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${isAnnual ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Anual
            <span className={`inline-flex items-center justify-center rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 ${isAnnual ? 'bg-emerald-500 text-white' : ''}`}>
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {PLAN_DEFINITIONS.map((plan) => {
          const highlight = plan.highlight;
          const btnHighlight = 'block w-full rounded-xl py-3 text-center text-sm font-bold transition disabled:opacity-60 bg-white text-blue-700 hover:bg-blue-50';
          const btnDefault  = 'block w-full rounded-xl py-3 text-center text-sm font-bold transition disabled:opacity-60 bg-slate-950 text-white hover:bg-slate-800';
          const btnClass    = highlight ? btnHighlight : btnDefault;
          const inactiveClass = `block w-full rounded-xl py-3 text-center text-xs font-bold ${highlight ? 'bg-white/20 text-white/60' : 'bg-slate-100 text-slate-400'}`;

          let ctaMode: CtaMode;
          let badge: string | undefined;
          let badgeVariant: 'popular' | 'current' = 'popular';
          let loading = false;
          let onSubscribeFn = () => {};
          let onUpgradeFn: (() => void) | undefined;

          if (plan.id === 'free') {
            ctaMode = getFreeCta(data.plan);
            if (data.plan === 'free') { badge = 'Plano atual'; badgeVariant = 'current'; }
          } else if (plan.id === 'pro') {
            ctaMode = proCta;
            loading = subscribeLoading === 'pro';
            onSubscribeFn = () => handleSubscribe('pro');
            badge = proCta === 'current' ? 'Plano atual' : 'Popular';
            badgeVariant = proCta === 'current' ? 'current' : 'popular';
          } else {
            ctaMode = ultraCta;
            loading = subscribeLoading === 'ultra';
            onSubscribeFn = () => handleSubscribe('ultra');
            onUpgradeFn = () => setShowUpgradeModal(true);
            if (ultraCta === 'current') { badge = 'Plano atual'; badgeVariant = 'current'; }
          }

          let cta: React.ReactNode = null;
          if (ctaMode === 'subscribe') {
            cta = (
              <button type="button" onClick={onSubscribeFn} disabled={loading} className={btnClass}>
                {loading ? 'Aguarde...' : plan.cta}
              </button>
            );
          } else if (ctaMode === 'current' || ctaMode === 'free-current') {
            cta = <div className={inactiveClass}>Plano atual</div>;
          } else if (ctaMode === 'upgrade') {
            cta = (
              <button type="button" onClick={onUpgradeFn} className={btnClass}>
                Fazer upgrade para Ultra
              </button>
            );
          } else if (ctaMode === 'blocked-pending') {
            cta = <div className={inactiveClass}>Aguarde a confirmação ou cancele</div>;
          } else if (ctaMode === 'blocked-active') {
            cta = <div className={inactiveClass}>Cancele o plano atual para contratar</div>;
          }

          const { id, href, ...cardProps } = plan;
          return (
            <div
              key={id}
              data-plan-card={id}
              className={`rounded-3xl transition-all duration-300 ${
                highlightPlan === id ? 'ring-2 ring-violet-400 ring-offset-2' : ''
              }`}
            >
              <PricingCard
                {...cardProps}
                isAnnual={isAnnual}
                cta={cta}
                badge={badge}
                badgeVariant={badgeVariant}
              />
            </div>
          );
        })}
      </div>

      {/* Modal de cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950">{cancelButtonLabel}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  {isPendingSubscription
                    ? 'A solicitação de assinatura será cancelada. Você poderá contratar outro plano depois.'
                    : 'Tem certeza? Seu plano não será renovado. O acesso continua até o fim do período pago.'}
                </p>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="ml-4 shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {cancelLoading ? 'Cancelando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de upgrade */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950">Upgrade para Ultra</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Para evitar cobranças duplicadas, cancele primeiro sua assinatura Pro. Assim que ela for
                  cancelada, você poderá contratar o Ultra.
                </p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="ml-4 shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelFromUpgradeModal}
                disabled={cancelLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {cancelLoading ? 'Cancelando...' : 'Cancelar assinatura Pro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
