import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, Lock } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) { toast.error('Preencha todos os campos.'); return; }
    if (password.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { toast.error('As senhas não coincidem.'); return; }
    if (!token) { toast.error('Link inválido. Solicite um novo.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Token inválido ou expirado. Solicite um novo link.');
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
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 shadow-lg">
              <Building2 className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-none">
              <p className="text-[15px] font-extrabold tracking-[-0.03em] text-slate-950">Condomínio</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">em Dia</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.11)] ring-1 ring-slate-200/70 sm:p-9">
          {!done ? (
            <>
              <div className="mb-8">
                <p className="eyebrow mb-3">Nova senha</p>
                <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-slate-950">
                  Redefinir senha
                </h1>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Escolha uma senha forte com pelo menos 6 caracteres.
                </p>
              </div>

              {!token && (
                <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  Link inválido ou expirado. Por favor,{' '}
                  <Link to="/esqueci-senha" className="font-extrabold underline">
                    solicite um novo link
                  </Link>
                  .
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Nova senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  autoFocus
                />
                <Input
                  label="Confirmar nova senha"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                  disabled={!token}
                >
                  Salvar nova senha
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="eyebrow mb-3">Pronto!</p>
              <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">
                Senha redefinida
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                Sua senha foi atualizada com sucesso. Faça login para continuar.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="mt-6 w-full"
                size="lg"
              >
                Ir para o login
              </Button>
            </div>
          )}

          {!done && (
            <>
              <div className="mt-7 h-px bg-slate-100" />
              <Link
                to="/login"
                className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
