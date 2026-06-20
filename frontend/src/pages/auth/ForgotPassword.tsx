import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Informe seu e-mail.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch {
      toast.error('Não foi possível processar sua solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] px-5 py-10 sm:px-10">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="relative w-full max-w-[460px] animate-fade-in">

        {/* Brand */}
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>

        <div className="rounded-[28px] border border-white bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.11)] ring-1 ring-slate-200/70 sm:p-9">
          {!sent ? (
            <>
              <div className="mb-8">
                <p className="eyebrow mb-3">Recuperar acesso</p>
                <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-slate-950">
                  Esqueceu a senha?
                </h1>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Informe seu e-mail cadastrado. Vamos enviar um link para você criar uma nova senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="E-mail cadastrado"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                  autoFocus
                />
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                  icon={!loading ? <Send className="h-4 w-4" /> : undefined}
                >
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 ring-1 ring-emerald-100">
                <Mail className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="eyebrow mb-3">E-mail enviado</p>
              <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">
                Verifique sua caixa de entrada
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                Se o endereço <strong className="text-slate-800">{email}</strong> estiver cadastrado, você receberá
                um link para redefinir sua senha em breve.
              </p>
              <p className="mt-3 text-xs font-semibold text-slate-400">
                Não recebeu? Verifique o spam ou aguarde alguns minutos.
              </p>
            </div>
          )}

          <div className="mt-7 h-px bg-slate-100" />
          <Link
            to="/login"
            className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
