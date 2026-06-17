import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import BrandMark from '../../components/ui/BrandMark';
import { useAuth } from '../../contexts/AuthContext';

const AcceptInvite: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const { acceptInvite } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error('Convite inválido');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    setLoading(true);
    try {
      await acceptInvite(token, password);
      toast.success('Conta ativada!');
      navigate('/morador');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Não foi possível aceitar o convite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f3ff] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px]" />
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="absolute -bottom-24 left-14 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <BrandMark inverted />
          </div>

          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Acesso do morador
            </span>
            <h1 className="mt-6 text-5xl font-black tracking-[-0.07em]">
              Ative sua conta em poucos segundos.
            </h1>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-300">
              Depois de criar sua senha, você acessa cobranças, comunicados, ocorrências e reservas da sua unidade.
            </p>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-3">
            {['Convite seguro', 'Perfil vinculado', 'Acesso imediato'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-black text-slate-100">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandMark />
            </div>

            <form onSubmit={handleSubmit} className="rounded-[2rem] border border-violet-100 bg-white/95 p-7 shadow-[0_28px_90px_rgba(76,29,149,0.16)] sm:p-9">
              <div className="mb-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Building2 className="h-5 w-5" />
                </span>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.26em] text-violet-700">Convite recebido</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-slate-950">Crie sua senha</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Seu cadastro já foi vinculado ao condomínio. Defina uma senha para entrar na área do morador.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nova senha"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  icon={<KeyRound className="h-4 w-4" />}
                  placeholder="Mínimo 6 caracteres"
                />
                <Input
                  label="Confirmar senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  placeholder="Repita a senha"
                />
              </div>

              <Button type="submit" loading={loading} icon={<ArrowRight className="h-4 w-4" />} className="mt-6 w-full justify-center rounded-xl border-violet-700 bg-violet-700 shadow-lg shadow-violet-700/20 hover:border-violet-800 hover:bg-violet-800">
                Ativar minha conta
              </Button>

              <p className="mt-6 text-center text-sm font-semibold text-slate-500">
                Já tem conta?{' '}
                <Link to="/login" className="font-black text-violet-700 hover:text-violet-800">
                  Entrar
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AcceptInvite;
