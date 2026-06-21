import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

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

const PRICES = {
  pro:   { monthly: 97.00,   yearly: 931.20  },
  ultra: { monthly: 197.00,  yearly: 1891.20 },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
  const [subscribeLoading, setSubscribeLoading] = useState<'pro' | 'ultra' | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BillingData>({
    queryKey: ['billing', 'me'],
    queryFn: () => api.get('/billing/me').then((r) => r.data),
  });

  const canCreateNewSubscription =
    !data?.subscription &&
    !['pending', 'active', 'overdue'].includes(data?.subscriptionStatus ?? '');

  const hasActiveSubscription = !!data?.subscription;
  const showCanceledBanner =
    (data?.subscriptionStatus === 'canceled' || data?.subscriptionStatus === 'failed') &&
    !hasActiveSubscription &&
    data?.plan !== 'free';

  const handleSubscribe = async (plan: 'pro' | 'ultra') => {
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
      toast.success('Assinatura cancelada com sucesso.');
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao cancelar assinatura.');
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

      {/* Plano atual */}
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
            {data.subscriptionStatus && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[data.subscriptionStatus] ?? 'bg-slate-100 text-slate-500'}`}>
                {STATUS_LABEL[data.subscriptionStatus] ?? data.subscriptionStatus}
              </span>
            )}
            {data.billingCycle && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {data.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
              </span>
            )}
          </div>
        </div>

        {data.currentPeriodEnd && (
          <p className="mt-4 text-sm font-medium text-slate-500">
            Próxima renovação: <strong className="text-slate-700">{formatDate(data.currentPeriodEnd)}</strong>
          </p>
        )}

        {hasActiveSubscription && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-sm font-bold text-red-500 transition hover:text-red-700"
            >
              Cancelar assinatura
            </button>
          </div>
        )}
      </div>

      {/* Banner: assinatura em andamento */}
      {hasActiveSubscription && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Você já possui uma assinatura em andamento. Para trocar de plano, cancele a assinatura atual.
        </div>
      )}

      {/* Banner: assinatura cancelada/falhou */}
      {showCanceledBanner && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          Sua assinatura anterior foi cancelada. Você pode contratar um novo plano abaixo.
        </div>
      )}

      {/* Toggle mensal / anual */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-bold ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Mensal</span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative h-6 w-11 rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-slate-300'}`}
          aria-label="Alternar ciclo de cobrança"
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isAnnual ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm font-bold ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>
          Anual <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">-20%</span>
        </span>
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Pro */}
        <PlanCard
          name="Pro"
          price={isAnnual ? PRICES.pro.yearly : PRICES.pro.monthly}
          isAnnual={isAnnual}
          isCurrent={data.plan === 'pro'}
          canSubscribe={canCreateNewSubscription}
          hasActive={hasActiveSubscription}
          loading={subscribeLoading === 'pro'}
          onSubscribe={() => handleSubscribe('pro')}
          features={['Até 200 unidades', 'Cobranças e financeiro', 'Comunicados ilimitados', 'Reservas e encomendas', 'Suporte por e-mail']}
          color="blue"
        />

        {/* Ultra */}
        <PlanCard
          name="Ultra"
          price={isAnnual ? PRICES.ultra.yearly : PRICES.ultra.monthly}
          isAnnual={isAnnual}
          isCurrent={data.plan === 'ultra'}
          canSubscribe={canCreateNewSubscription}
          hasActive={hasActiveSubscription}
          loading={subscribeLoading === 'ultra'}
          onSubscribe={() => handleSubscribe('ultra')}
          features={['Unidades ilimitadas', 'Relatórios avançados', 'Portaria integrada', 'API de acesso', 'Suporte prioritário']}
          color="violet"
        />
      </div>

      {/* Modal de cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950">Cancelar assinatura</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Tem certeza que deseja cancelar? Seu plano não será renovado pelo Mercado Pago. O acesso continua até o fim do período pago.
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
                {cancelLoading ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PlanCardProps {
  name: string;
  price: number;
  isAnnual: boolean;
  isCurrent: boolean;
  canSubscribe: boolean;
  hasActive: boolean;
  loading: boolean;
  onSubscribe: () => void;
  features: string[];
  color: 'blue' | 'violet';
}

const PlanCard: React.FC<PlanCardProps> = ({
  name, price, isAnnual, isCurrent, canSubscribe, hasActive, loading, onSubscribe, features, color,
}) => {
  const colorMap = {
    blue: {
      border: 'border-blue-100',
      badge: 'bg-blue-600 text-white',
      btn: 'bg-blue-600 text-white hover:bg-blue-700',
      icon: 'text-blue-400',
    },
    violet: {
      border: 'border-violet-100',
      badge: 'bg-violet-600 text-white',
      btn: 'bg-violet-600 text-white hover:bg-violet-700',
      icon: 'text-violet-400',
    },
  };

  const c = colorMap[color];
  const canClick = canSubscribe && !isCurrent && !loading;

  return (
    <div className={`surface-card relative flex flex-col p-6 ${isCurrent ? `ring-2 ring-${color === 'blue' ? 'blue' : 'violet'}-400` : ''}`}>
      {isCurrent && (
        <span className={`absolute -top-3 left-5 rounded-full px-3 py-1 text-xs font-black ${c.badge}`}>
          Seu plano atual
        </span>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-extrabold tracking-tight text-slate-950">{name}</h3>
        <p className="mt-1">
          <span className="text-3xl font-extrabold tracking-tight text-slate-950">{price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          <span className="ml-1 text-sm font-medium text-slate-400">/{isAnnual ? 'ano' : 'mês'}</span>
        </p>
        {isAnnual && (
          <p className="mt-0.5 text-xs font-semibold text-emerald-600">
            equiv. {formatCurrency(price / 12)}/mês
          </p>
        )}
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <CheckCircle2 className={`h-4 w-4 shrink-0 ${c.icon}`} />
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-center text-sm font-bold text-slate-400">
          Plano atual
        </div>
      ) : hasActive ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-center text-xs font-bold text-slate-400">
          Cancele o plano atual para contratar
        </div>
      ) : (
        <button
          onClick={onSubscribe}
          disabled={!canClick}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${c.btn}`}
        >
          {loading ? 'Aguarde...' : `Assinar ${name}`}
        </button>
      )}
    </div>
  );
};

export default BillingPage;
