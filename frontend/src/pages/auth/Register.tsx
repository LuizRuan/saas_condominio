import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, UserRound } from 'lucide-react';
import { BRAZILIAN_STATES, validatePixKey } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '',
    condominiumName: '', city: '', state: '', pixKey: '',
    defaultFee: '', dueDay: '10',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let masked = digits;
    if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    setForm({ ...form, phone: masked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.condominiumName) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error('Informe um e-mail válido (ex: nome@gmail.com)');
      return;
    }
    if (form.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (form.pixKey) {
      const pixValidation = validatePixKey(form.pixKey);
      if (!pixValidation.valid) { toast.error(pixValidation.error!); return; }
    }
    setLoading(true);
    try {
      await register({
        ...form,
        defaultFee: Number(form.defaultFee) || 0,
        dueDay: Number(form.dueDay) || 10,
      });
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const stateOptions = BRAZILIAN_STATES.map((s) => ({ value: s, label: s }));

  return (
    <div className="min-h-screen bg-[#f4f7fb] lg:grid lg:grid-cols-[360px_1fr]">
      <aside className="auth-grid relative hidden min-h-screen overflow-hidden bg-slate-950 p-9 lg:flex lg:flex-col">
        <div className="absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-blue-600/20 blur-[90px]" />
        <div className="relative z-10">
          <BrandMark inverted />
        </div>
        <div className="relative z-10 my-auto">
          <p className="eyebrow text-blue-300">Comece agora</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-0.05em] text-white">
            Seu condomínio merece uma gestão à altura.
          </h1>
          <p className="mt-5 text-sm font-medium leading-6 text-slate-400">
            Configure sua operação em poucos minutos e centralize a rotina em uma única plataforma.
          </p>
          <div className="mt-8 space-y-3">
            {['Cadastro rápido', 'Sem complexidade técnica', 'Pronto para sua equipe'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <Link to="/login" className="relative z-10 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </aside>

      <main className="flex min-h-screen justify-center px-4 py-8 sm:px-8 lg:overflow-y-auto lg:px-12 lg:py-12">
        <div className="w-full max-w-3xl animate-fade-in">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandMark />
            <Link to="/login" className="text-xs font-bold text-blue-600">Entrar</Link>
          </div>

          <div className="mb-8">
            <p className="eyebrow mb-3">Nova conta</p>
            <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-4xl">Configure sua gestão</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">
              Informe seus dados e as configurações iniciais do condomínio. Você poderá editar tudo depois.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="surface-card p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-[-0.02em] text-slate-950">Dados do responsável</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Seu acesso administrativo à plataforma</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Nome completo *" name="name" value={form.name} onChange={handleChange} placeholder="Seu nome" autoComplete="name" />
                <Input label="Telefone" name="phone" value={form.phone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" autoComplete="tel" maxLength={15} />
                <Input label="E-mail *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" autoComplete="email" />
                <Input label="Senha *" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
              </div>
            </section>

            <section className="surface-card p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-[-0.02em] text-slate-950">Dados do condomínio</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Informações básicas para iniciar a operação</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Nome do condomínio *" name="condominiumName" value={form.condominiumName} onChange={handleChange} placeholder="Residencial Aurora" containerClassName="sm:col-span-2" />
                <Input label="Cidade" name="city" value={form.city} onChange={handleChange} placeholder="São Paulo" />
                <Select label="Estado" name="state" value={form.state} onChange={handleChange} options={stateOptions} placeholder="Selecione" />
                <Input label="Chave Pix (CPF, CNPJ, e-mail ou telefone)" name="pixKey" value={form.pixKey} onChange={handleChange} placeholder="CPF, CNPJ, e-mail ou telefone" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Taxa padrão (R$)" name="defaultFee" type="number" min="0" step="0.01" value={form.defaultFee} onChange={handleChange} placeholder="350" />
                  <Input label="Dia vencimento" name="dueDay" type="number" min="1" max="31" value={form.dueDay} onChange={handleChange} placeholder="10" />
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse items-center justify-between gap-4 pb-6 sm:flex-row">
              <p className="text-center text-xs font-medium text-slate-500 sm:text-left">
                Ao continuar, você cria o ambiente administrativo do condomínio.
              </p>
              <Button type="submit" loading={loading} size="lg" className="w-full sm:w-auto" icon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}>
                Criar conta e começar
              </Button>
            </div>
          </form>
        </div>
      </main>
      </div>
  );
};

export default Register;
