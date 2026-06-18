import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, CheckCircle2, Shield, Zap, Users, Receipt,
  Megaphone, AlertTriangle, CalendarDays, Package, ArrowRight,
  Star, ChevronDown, Menu, X, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const features = [
  { icon: Receipt, title: 'Cobranças automáticas', desc: 'Gere cobranças em massa, acompanhe status e envie lembretes via WhatsApp com um clique.' },
  { icon: Users, title: 'Gestão de moradores', desc: 'Cadastre moradores, envie convites por link e vincule ao portal de forma automática.' },
  { icon: AlertTriangle, title: 'Ocorrências', desc: 'Moradores abrem chamados com fotos. Você responde com chat integrado e rastreia o status.' },
  { icon: CalendarDays, title: 'Reservas de áreas', desc: 'Controle de horários de salão, churrasqueira e academia com aprovação do síndico.' },
  { icon: Megaphone, title: 'Comunicados', desc: 'Publique avisos com fotos, fixe os importantes e todos os moradores recebem notificação.' },
  { icon: Package, title: 'Encomendas', desc: 'Registre chegadas e notifique moradores para retirada, acabando com os esquecimentos.' },
];

const plans = [
  {
    name: 'Starter',
    price: 'Grátis',
    period: '',
    desc: 'Ideal para testar a plataforma.',
    items: ['Até 20 unidades', 'Dashboard completo', 'Cobranças e comunicados', 'Suporte por e-mail'],
    cta: 'Começar grátis',
    href: '/cadastro',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'R$97',
    period: '/mês',
    desc: 'Para condomínios em operação.',
    items: ['Até 100 unidades', 'Tudo do Starter', 'Relatórios PDF', 'WhatsApp integrado', 'Suporte prioritário'],
    cta: 'Assinar Pro',
    href: '/cadastro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'R$197',
    period: '/mês',
    desc: 'Para síndicos profissionais.',
    items: ['Unidades ilimitadas', 'Tudo do Pro', 'Multi-condomínio', 'Pix automático', 'SLA garantido'],
    cta: 'Falar com vendas',
    href: '/cadastro',
    highlight: false,
  },
];

const faqs = [
  { q: 'Preciso instalar alguma coisa?', a: 'Não. O Condomínio em Dia é 100% web. Funciona em qualquer dispositivo sem instalação.' },
  { q: 'Os moradores precisam criar conta?', a: 'Você envia um link de convite por e-mail ou WhatsApp. O morador clica, cria a senha e já acessa o portal.' },
  { q: 'Como funciona o trial?', a: 'O plano Starter é gratuito sem limite de tempo para até 20 unidades. Não precisa de cartão.' },
  { q: 'Posso migrar meus dados de planilhas?', a: 'Sim. Oferecemos importação via CSV para unidades, moradores e histórico de cobranças.' },
  { q: 'Os dados ficam seguros?', a: 'Sim. Utilizamos MongoDB Atlas com criptografia, HTTPS em toda comunicação e autenticação JWT.' },
];

const LandingPage: React.FC = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user, logout } = useAuth();

  const handleAuthClick = () => {
    if (user) logout();
  };

  return (
    <div className="min-h-screen bg-white font-[Manrope,system-ui,sans-serif] text-slate-900">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 shadow-md">
              <Building2 className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-none">
              <p className="text-[15px] font-extrabold tracking-[-0.03em]">Condomínio</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">em Dia</p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            {['Funcionalidades', 'Preços', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user && (
              <Link to={user.role === 'admin' ? '/dashboard' : '/morador'} className="text-sm font-bold text-blue-600 transition hover:text-blue-700">
                Acessar Painel
              </Link>
            )}
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
              {['Funcionalidades', 'Preços', 'FAQ'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenu(false)}
                  className="text-sm font-semibold text-slate-600"
                >
                  {item}
                </a>
              ))}
              <hr className="border-slate-100" />
              {user && (
                <Link to={user.role === 'admin' ? '/dashboard' : '/morador'} className="text-sm font-bold text-blue-600">Acessar Painel</Link>
              )}
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
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-1.5 text-xs font-bold text-blue-200">
            <Star className="h-3.5 w-3.5 fill-blue-300 text-blue-300" />
            SaaS de gestão condominial — simples e profissional
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.055em] sm:text-5xl md:text-6xl">
            Chega de planilha.{' '}
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Gerencie seu condomínio online.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-7 text-slate-400 sm:text-lg">
            Cobranças, moradores, ocorrências, reservas e comunicados em um único sistema.
            Fácil para o síndico, transparente para o morador.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/cadastro"
              onClick={handleAuthClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-blue-950/40 transition hover:bg-blue-500 sm:w-auto"
            >
              Começar gratuitamente
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              onClick={handleAuthClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-7 py-4 text-base font-bold text-white transition hover:bg-white/[0.12] sm:w-auto"
            >
              Já tenho conta
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-500">
            {['Sem cartão de crédito', 'Plano gratuito permanente', 'Configuração em 5 minutos'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {t}
              </span>
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
              { icon: Shield, label: 'Dados seguros', desc: 'HTTPS + JWT + MongoDB Atlas com criptografia.' },
              { icon: Zap, label: 'Rápido de configurar', desc: 'Do cadastro ao primeiro morador em menos de 10 minutos.' },
              { icon: CheckCircle2, label: 'Sempre disponível', desc: 'Infraestrutura na nuvem com uptime 99,9%.' },
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
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative overflow-hidden rounded-3xl border p-7 ${
                  plan.highlight
                    ? 'border-blue-500 bg-blue-600 text-white shadow-2xl shadow-blue-600/30'
                    : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">
                    Popular
                  </div>
                )}
                <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${plan.highlight ? 'text-blue-200' : 'text-blue-600'}`}>
                  {plan.name}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold tracking-[-0.05em] ${plan.highlight ? 'text-white' : 'text-slate-950'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`mb-1.5 text-sm font-semibold ${plan.highlight ? 'text-blue-200' : 'text-slate-400'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`mt-1.5 text-sm font-medium ${plan.highlight ? 'text-blue-100' : 'text-slate-500'}`}>
                  {plan.desc}
                </p>
                <ul className="my-6 space-y-3">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm font-semibold">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-emerald-500'}`} />
                      <span className={plan.highlight ? 'text-white' : 'text-slate-700'}>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition ${
                    plan.highlight
                      ? 'bg-white text-blue-700 hover:bg-blue-50'
                      : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
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
            Pronto para modernizar a gestão do seu condomínio?
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-400">
            Cadastre-se em 2 minutos. Sem cartão, sem burocracia.
          </p>
          <Link
            to="/cadastro"
            onClick={handleAuthClick}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-950/40 transition hover:bg-blue-500"
          >
            Criar minha conta grátis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700">
              <Building2 className="h-4 w-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-sm font-extrabold text-slate-800">Condomínio em Dia</span>
          </div>
          <p className="text-xs font-medium text-slate-400">
            © {new Date().getFullYear()} Condomínio em Dia. Todos os direitos reservados.
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
