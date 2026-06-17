import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import { Building2, CalendarDays, CreditCard, MapPin, Pencil, Save, ShieldCheck, X } from 'lucide-react';
import { BRAZILIAN_STATES, formatCurrency } from '../../utils/helpers';
import api from '../../services/api';
import { Condominium } from '../../types';
import toast from 'react-hot-toast';

const CondominiumPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [condo, setCondo] = useState<Condominium | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  type FormState = { name: string; cnpj: string; address: string; city: string; state: string; pixKey: string; defaultFee: number; dueDay: number };
  const emptyForm: FormState = { name: '', cnpj: '', address: '', city: '', state: '', pixKey: '', defaultFee: 0, dueDay: 10 };
  const [form, setForm] = useState<FormState>(emptyForm);
  const [savedForm, setSavedForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    const loadCondominium = async () => {
      try {
        const { data } = await api.get('/condominiums/my');
        setCondo(data);
        const values: FormState = {
          name: data.name, cnpj: data.cnpj, address: data.address,
          city: data.city, state: data.state, pixKey: data.pixKey,
          defaultFee: data.defaultFee, dueDay: data.dueDay
        };
        setForm(values);
        setSavedForm(values);
      } catch (err: any) {
        if (err.response?.status !== 404) {
          toast.error(err.response?.data?.error || 'Erro ao carregar condomínio');
        }
      } finally {
        setLoading(false); }
    };
    loadCondominium();
  }, []);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setForm(savedForm);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Informe o nome do condomínio'); return; }
    if (form.dueDay < 1 || form.dueDay > 31) { toast.error('O dia de vencimento deve ficar entre 1 e 31'); return; }

    setSaving(true);
    try {
      const { data } = condo
        ? await api.put(`/condominiums/${condo._id}`, form)
        : await api.post('/condominiums', form);
      setCondo(data);
      setSavedForm(form);
      setIsEditing(false);
      toast.success(condo ? 'Condomínio atualizado!' : 'Condomínio criado!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Condomínio"
      subtitle="Defina identidade, endereço e regras financeiras da operação."
      onMenuClick={onMenuClick}
      actions={(
        isEditing ? (
          <>
            <Button variant="secondary" onClick={handleCancel} icon={<X className="h-4 w-4" />} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving} icon={<Save className="h-4 w-4" />} className="w-full sm:w-auto">
              Salvar alterações
            </Button>
          </>
        ) : (
          <Button onClick={handleEdit} icon={<Pencil className="h-4 w-4" />} className="w-full sm:w-auto">
            Editar dados
          </Button>
        )
      )}
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Cadastro" value={condo ? 'Ativo' : 'Novo'} helper="condomínio" icon={<ShieldCheck className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" valueClassName="text-emerald-700" />
        <MetricCard label="Taxa padrão" value={formatCurrency(Number(form.defaultFee) || 0)} helper="por unidade" icon={<CreditCard className="h-4 w-4" />} iconClass="bg-blue-100 text-blue-700" />
        <MetricCard label="Vencimento" value={`Dia ${form.dueDay || 1}`} helper="todo mês" icon={<CalendarDays className="h-4 w-4" />} iconClass="bg-indigo-100 text-indigo-700" />
        <MetricCard label="Chave Pix" value={form.pixKey ? 'OK' : 'Pendente'} helper={form.pixKey ? 'configurada' : 'sem chave'} icon={<CreditCard className="h-4 w-4" />} iconClass={form.pixKey ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} valueClassName={form.pixKey ? 'text-emerald-700' : 'text-red-600'} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="surface-panel">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="section-title">Dados do condomínio</h2>
                <p className="mt-0.5 text-xs font-medium text-slate-400">Informações usadas em cobranças, comunicados e relatórios.</p>
              </div>
            </div>
            {isEditing && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                Modo edição
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
            <Input label="Nome" value={form.name} disabled={!isEditing} onChange={(e) => setForm({ ...form, name: e.target.value })} containerClassName="sm:col-span-2" />
            <Input label="CNPJ" value={form.cnpj} disabled={!isEditing} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            <Input label="Endereço" value={form.address} disabled={!isEditing} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Cidade" value={form.city} disabled={!isEditing} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Select label="Estado" value={form.state} disabled={!isEditing} onChange={(e) => setForm({ ...form, state: e.target.value })} options={BRAZILIAN_STATES.map((s) => ({ value: s, label: s }))} placeholder="Selecione" />
            <Input label="Chave Pix" value={form.pixKey} disabled={!isEditing} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} containerClassName="sm:col-span-2" />
            <Input label="Taxa padrão (R$)" type="number" min="0" step="0.01" value={String(form.defaultFee)} disabled={!isEditing} onChange={(e) => setForm({ ...form, defaultFee: Number(e.target.value) })} />
            <Input label="Dia de vencimento" type="number" min="1" max="31" value={String(form.dueDay)} disabled={!isEditing} onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) })} />
          </div>

          {!isEditing && (
            <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
              <p className="text-xs font-medium text-slate-400">
                Clique em <strong className="text-slate-600">Editar dados</strong> no cabeçalho para alterar as informações do condomínio.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="surface-card bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/15">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-blue-200">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-extrabold tracking-[-0.03em]">Identidade da gestão</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
              Dados claros aumentam confiança nos comunicados, cobranças e acessos dos moradores.
            </p>
          </div>
          <div className="surface-card p-6">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h3 className="mt-4 text-base font-extrabold tracking-[-0.03em] text-slate-950">Financeiro pronto</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              A taxa padrão e o dia de vencimento aceleram a criação de cobranças em massa.
            </p>
          </div>
        </aside>
      </section>
    </PremiumPage>
  );
};

export default CondominiumPage;
