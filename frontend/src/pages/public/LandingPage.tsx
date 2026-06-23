import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Shield, Zap, Users, Receipt,
  Megaphone, AlertTriangle, CalendarDays, Package, ArrowRight,
  ChevronDown, Menu, X, WalletCards
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import BrandMark from '../../components/ui/BrandMark';
import api from '../../services/api';
import PricingCard from '../../components/billing/PricingCard';
import { PLAN_DEFINITIONS } from '../../config/plans';

const features = [
  { icon: Receipt, title: 'Cobranças e inadimplência', desc: 'Gere cobranças em massa, acompanhe pagamentos e envie lembretes aos moradores.' },
  { icon: Users, title: 'Moradores e unidades', desc: 'Organize proprietários, inquilinos e responsáveis financeiros por unidade.' },
  { icon: WalletCards, title: 'Despesas do condomínio', desc: 'Lance contas de luz, água, segurança, limpeza e acompanhe o saldo mensal.' },
  { icon: AlertTriangle, title: 'Ocorrências com histórico', desc: 'Registre solicitações, acompanhe status e mantenha tudo documentado.' },
  { icon: CalendarDays, title: 'Reservas de áreas', desc: 'Controle de horários de salão, churrasqueira e academia com aprovação do síndico.' },
  { icon: Megaphone, title: 'Comunicados', desc: 'Publique avisos com fotos, fixe os importantes e todos os moradores recebem notificação.' },
  { icon: Package, title: 'Encomendas', desc: 'Registre chegadas e notifique moradores para retirada, acabando com os esquecimentos.' },
];

const faqs = [
  { q: 'Preciso instalar alguma coisa?', a: 'Não. O Domus é 100% online e funciona direto pelo navegador, no computador, tablet ou celular.' },
  { q: 'Os moradores precisam criar conta?', a: 'Sim, mas o processo é simples. O síndico envia um convite por link, e-mail ou WhatsApp. O morador cria a senha e acessa o portal em poucos minutos.' },
  { q: 'Como funciona o plano grátis?', a: 'O plano Grátis pode ser usado sem limite de tempo para condomínios com até 20 unidades. Não precisa de cartão de crédito para começar.' },
  { q: 'Posso migrar meus dados de planilhas?', a: 'Sim. Você pode importar unidades, moradores e cobranças por planilha, evitando cadastrar tudo manualmente.' },
  { q: 'Os dados ficam seguros?', a: 'Sim. O Domus utiliza acesso seguro, criptografia e autenticação protegida para manter as informações do condomínio e dos moradores em segurança.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Os planos pagos podem ser cancelados quando necessário, sem burocracia.' },
  { q: 'O Domus serve para administradoras?', a: 'Sim. O plano Ultra permite gerenciar mais de um condomínio em uma única plataforma.' },
  { q: 'Os moradores conseguem acessar pelo celular?', a: 'Sim. O portal do morador funciona pelo navegador do celular, sem necessidade de instalação.' },
];

const LandingPage: React.FC = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);
  const { user, logout, loginDemo, isDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (planName: 'pro' | 'ultra') => {
    const billingCycle = isAnnual ? 'yearly' : 'monthly';
    setSubscribeLoading(planName);
    try {
      const res = await api.post('/billing/mercadopago/subscribe', { plan: planName, billingCycle });
      window.location.href = res.data.checkoutUrl;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao criar assinatura. Tente novamente.');
    } finally {
      setSubscribeLoading(null);
    }
  };

  const handleAuthClick = () => {
    if (user) logout();
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch {
      // toast de erro já é exibido pelo axios interceptor
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-[Manrope,system-ui,sans-serif] text-slate-900">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <BrandMark compact />

          <nav className="hidden items-center gap-7 md:flex">
            {['Ver funcionalidades', 'Preços', 'Dúvidas'].map((item) => {
              const hash = item === 'Ver funcionalidades' ? 'funcionalidades' : item === 'Dúvidas' ? 'faq' : item.toLowerCase();
              return (
                <a
                  key={item}
                  href={`#${hash}`}
                  className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                >
                  {item}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" onClick={handleAuthClick} className="text-sm font-bold text-slate-500 transition hover:text-slate-900">
              Entrar
            </Link>
            <Link
              to="/cadastro"
              onClick={handleAuthClick}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-500"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 md:hidden"
            aria-label="Menu"
          >
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {['Ver funcionalidades', 'Preços', 'Dúvidas'].map((item) => {
                const hash = item === 'Ver funcionalidades' ? 'funcionalidades' : item === 'Dúvidas' ? 'faq' : item.toLowerCase();
                return (
                  <a
                    key={item}
                    href={`#${hash}`}
                    onClick={() => setMobileMenu(false)}
                    className="text-sm font-semibold text-slate-600"
                  >
                    {item}
                  </a>
                );
              })}
              <hr className="border-slate-100" />
              <Link to="/login" onClick={handleAuthClick} className="text-sm font-bold text-slate-600">Entrar</Link>
              <Link
                to="/cadastro"
                onClick={handleAuthClick}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
              >
                Começar grátis <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-950 px-5 py-24 text-white md:py-32">
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="absolute right-0 top-0 h-[40rem] w-[40rem] rounded-full bg-violet-600/20 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto max-w-7xl grid items-center gap-16 lg:grid-cols-2">
          <div className="max-w-2xl text-left">

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.055em] sm:text-5xl md:text-6xl">
              Menos planilhas.{' '}
              <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                Mais controle para o síndico.
              </span>
            </h1>
            <p className="mt-6 text-base font-medium leading-7 text-slate-400 sm:text-lg">
              Automatize cobranças, organize moradores, acompanhe despesas e mantenha o condomínio sempre em dia.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                to="/cadastro"
                onClick={handleAuthClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-blue-950/40 transition hover:bg-blue-500 sm:w-auto"
              >
                Começar grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                onClick={handleDemo}
                disabled={demoLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-7 py-4 text-base font-bold text-white transition hover:bg-white/[0.12] disabled:opacity-60 sm:w-auto"
              >
                {demoLoading ? 'Carregando demo...' : 'Ver demonstração'}
              </button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-start gap-5 text-xs font-semibold text-slate-400">
              {['Sem instalação', 'Configuração rápida', 'Financeiro integrado'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          
          <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
            {/* Dashboard Mockup */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-sm lg:aspect-auto lg:h-[450px]">
              <div className="flex h-10 items-center gap-2 border-b border-white/10 bg-slate-950 px-4">
                <div className="h-3 w-3 rounded-full bg-slate-800" />
                <div className="h-3 w-3 rounded-full bg-slate-800" />
                <div className="h-3 w-3 rounded-full bg-slate-800" />
              </div>
              <img src="/dashboard-mockup.png" alt="Dashboard Domus" className="h-full w-full object-cover object-left-top" />
            </div>
            
            {/* Glow effects around mockup */}
            <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]" />
            <div className="absolute -right-10 top-20 -z-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-[100px]" />
          </div>
        </div>
      </section>

      {/* ── Como Funciona ── */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              Comece em poucos minutos
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Cadastre o condomínio',
                desc: 'Configure nome, taxa padrão e vencimento.',
              },
              {
                step: '2',
                title: 'Importe unidades e moradores',
                desc: 'Cadastre manualmente ou importe por planilha.',
              },
              {
                step: '3',
                title: 'Gere cobranças e acompanhe tudo',
                desc: 'Veja recebidos, atrasos, despesas e comunicados em tempo real.',
              },
            ].map((s) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-xl font-black text-blue-600 ring-8 ring-white">
                  {s.step}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="bg-[#f8fafc] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600">Funcionalidades</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              Tudo que um condomínio precisa
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base font-medium text-slate-500">
              Módulos integrados que funcionam juntos para eliminar o trabalho manual do síndico.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-y border-slate-100 bg-white px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Shield, label: 'Dados protegidos', desc: 'Informações do condomínio e dos moradores armazenadas com segurança.' },
              { icon: Zap, label: 'Configuração rápida', desc: 'Cadastre o condomínio, unidades e moradores em poucos minutos.' },
              { icon: CheckCircle2, label: 'Funciona em qualquer lugar', desc: 'Acesse pelo navegador, sem instalação e sem depender de planilhas.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{label}</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="preços" className="bg-[#f8fafc] px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600">Preços</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              Simples e transparente
            </h2>
            <p className="mt-3 text-base font-medium text-slate-500">
              Comece grátis. Escale quando precisar.
            </p>
            
            {/* Toggle Mensal/Anual */}
            <div className="mx-auto mt-10 flex max-w-fit items-center gap-4 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${!isAnnual ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Mensal
              </button>
              <button
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
          <div className="grid gap-5 sm:grid-cols-3">
            {PLAN_DEFINITIONS.map((plan) => {
              const btnClass = `block w-full rounded-xl py-3 text-center text-sm font-bold transition disabled:opacity-60 ${
                plan.highlight
                  ? 'bg-white text-blue-700 hover:bg-blue-50'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              }`;
              const cta = (plan.id !== 'free' && user?.role === 'admin' && !isDemo) ? (
                <button
                  onClick={() => handleSubscribe(plan.id as 'pro' | 'ultra')}
                  disabled={subscribeLoading === plan.id}
                  className={btnClass}
                >
                  {subscribeLoading === plan.id ? 'Aguarde...' : plan.cta}
                </button>
              ) : (
                <Link
                  to={plan.id === 'free'
                    ? '/cadastro'
                    : `/cadastro?plan=${plan.id}&cycle=${isAnnual ? 'yearly' : 'monthly'}`
                  }
                  onClick={() => {
                    if (plan.id !== 'free') {
                      localStorage.setItem('pendingPlan', JSON.stringify({
                        plan: plan.id,
                        billingCycle: isAnnual ? 'yearly' : 'monthly',
                        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
                      }));
                    }
                  }}
                  className={btnClass}
                >
                  {plan.cta}
                </Link>
              );

              const { id, href, ...cardProps } = plan;
              return (
                <PricingCard
                  key={id}
                  {...cardProps}
                  isAnnual={isAnnual}
                  cta={cta}
                  badge={plan.highlight ? 'Popular' : undefined}
                  badgeVariant="popular"
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-white px-5 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600">FAQ</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">Dúvidas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-extrabold text-slate-900">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-slate-100 px-5 py-4 text-sm font-medium leading-6 text-slate-500">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-slate-950 px-5 py-20 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
            Comece a organizar seu condomínio hoje.
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-400">
            Crie sua conta grátis, cadastre as primeiras unidades e veja tudo funcionando em poucos minutos.
          </p>
          <Link
            to="/cadastro"
            onClick={handleAuthClick}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-950/40 transition hover:bg-blue-500"
          >
            Criar conta grátis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <BrandMark compact />
          <p className="text-xs font-medium text-slate-400">
            © {new Date().getFullYear()} Domus. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/login" onClick={handleAuthClick} className="text-xs font-semibold text-slate-400 hover:text-slate-700">Entrar</Link>
            <Link to="/cadastro" onClick={handleAuthClick} className="text-xs font-semibold text-slate-400 hover:text-slate-700">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
