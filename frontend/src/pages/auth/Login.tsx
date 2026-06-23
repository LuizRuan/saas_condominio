import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password);

      // Verificar plano pendente no localStorage
      let pending: { plan: string; billingCycle: string; expiresAt?: number } | null = null;
      try {
        const raw = localStorage.getItem('pendingPlan');
        if (raw) {
          const parsed = JSON.parse(raw);
          pending = (parsed.expiresAt && Date.now() > parsed.expiresAt) ? null : parsed;
          if (!pending) localStorage.removeItem('pendingPlan');
        }
      } catch { localStorage.removeItem('pendingPlan'); }

      if (pending && (pending.plan === 'pro' || pending.plan === 'ultra')) {
        if (loggedUser.role === 'admin' && !loggedUser.isDemo) {
          // Não dispara checkout aqui. Leva à tela de assinatura com o plano/ciclo
          // escolhidos; a BillingPage consome e limpa o pendingPlan.
          toast.success('Login realizado com sucesso!');
          const cycle = pending.billingCycle === 'yearly' ? 'yearly' : 'monthly';
          navigate(`/billing?plan=${pending.plan}&cycle=${cycle}`);
          return;
        }
        // Logado mas sem permissão para assinar → descarta o plano pendente.
        localStorage.removeItem('pendingPlan');
        if (loggedUser.role !== 'admin') {
          toast.error('Apenas o síndico pode contratar planos.');
        }
      }

      toast.success('Login realizado com sucesso!');
      navigate(loggedUser.role === 'admin' ? '/dashboard' : '/morador');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="auth-grid relative hidden min-h-screen overflow-hidden bg-slate-950 p-10 lg:flex lg:flex-col xl:p-14">
        <div className="absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute -right-20 top-16 h-80 w-80 rounded-full bg-indigo-500/15 blur-[100px]" />
        <div className="relative z-10">
          <Link to="/" aria-label="Voltar para a página inicial" className="inline-block transition-opacity hover:opacity-80">
            <BrandMark inverted />
          </Link>
        </div>

        <div className="relative z-10 my-auto max-w-xl py-16">

          <h1 className="max-w-lg text-5xl font-extrabold leading-[1.08] tracking-[-0.055em] text-white xl:text-6xl">
            Gestão simples.
            <span className="block bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Operação profissional.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base font-medium leading-7 text-slate-400">
            Centralize cobranças, moradores, comunicados e reservas em uma experiência clara para quem administra e para quem mora.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {['Financeiro organizado', 'Comunicação centralizada', 'Rotinas mais rápidas', 'Acesso seguro'].map((item) => (
              <div key={item} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.04] px-3.5 py-3 text-sm font-semibold text-slate-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs font-semibold text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Dados protegidos e acesso individual por perfil
        </div>
      </section>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] px-5 py-10 sm:px-10">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="relative w-full max-w-[460px] animate-fade-in">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/" aria-label="Voltar para a página inicial" className="inline-block transition-opacity hover:opacity-80">
              <BrandMark />
            </Link>
          </div>

          <div className="rounded-[28px] border border-white bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.11)] ring-1 ring-slate-200/70 sm:p-9">
            <div className="mb-8">
              <p className="eyebrow mb-3">Acesso à plataforma</p>
              <h2 className="text-3xl font-extrabold tracking-[-0.045em] text-slate-950">Bem-vindo de volta</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Entre com suas credenciais para acessar sua gestão.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
              />
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex h-full items-center justify-center p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <Button type="submit" loading={loading} className="w-full" size="lg" icon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}>
                Entrar na plataforma
              </Button>
              <div className="text-right">
                <Link
                  to="/esqueci-senha"
                  className="text-xs font-bold text-slate-400 transition-colors hover:text-blue-600"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </form>

            <div className="my-7 h-px bg-slate-100" />

            <p className="text-center text-sm font-medium text-slate-500">
              Ainda não tem conta?{' '}
              <Link to="/cadastro" className="font-extrabold text-blue-600 transition-colors hover:text-blue-700">
                Comece gratuitamente
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
